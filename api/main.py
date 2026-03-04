from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime
import io
import os

# PDF Generation
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import inch, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import qrcode
from PIL import Image

# Digital Signature
from pyhanko.sign import signers
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter

app = FastAPI(title="Dahar Engineer Certificate API")

# --- CORS Settings ---
# Allow your React frontend to communicate with this API
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*" # For dev, ideally restrict in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---
class CertificateRequest(BaseModel):
    userName: str
    courseTitle: str
    completedAt: str
    certificateId: str


# --- Helper: Generate Raw PDF using ReportLab ---
def create_raw_certificate(data: CertificateRequest) -> io.BytesIO:
    """Generates the clean certificate design in PDF bytes."""
    buffer = io.BytesIO()
    
    # ReportLab uses points (1/72 inch). A4 Landscape is ~842 x 595 points.
    width, height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    # 1. Background / Borders
    c.setFillColorRGB(1, 1, 1) # White
    c.rect(0, 0, width, height, fill=1)
    
    # Colors
    c_dark_blue = (44/255, 62/255, 80/255) # #2c3e50
    
    # Decorative Borders
    c.setStrokeColorRGB(*c_dark_blue, alpha=0.2)
    c.setLineWidth(3)
    c.rect(30, 30, width - 60, height - 60)
    
    c.setStrokeColorRGB(*c_dark_blue, alpha=0.1)
    c.setLineWidth(1)
    c.rect(40, 40, width - 80, height - 80)
    
    # Text Setup
    # Ideally, register your actual fonts here (e.g., pdfmetrics.registerFont(TTFont('Merriweather-Italic', 'fonts/Merriweather-Italic.ttf')))
    # For now we use standard fonts
    F_TITLE = "Helvetica-BoldOblique"
    F_NORMAL = "Helvetica"
    F_SERIF = "Times-BoldItalic"
    
    c.setFillColorRGB(*c_dark_blue)
    
    # 2. Header
    c.setFont(F_TITLE, 48)
    c.drawCentredString(width / 2, height - 140, "SERTIFIKAT")
    
    c.setFont(F_NORMAL, 14)
    c.drawCentredString(width / 2, height - 170, "P E N G H A R G A A N")
    
    # Draw Lines around PENGHARGAAN
    c.setStrokeColorRGB(*c_dark_blue, alpha=0.3)
    c.setLineWidth(1)
    c.line(width/2 - 200, height - 165, width/2 - 90, height - 165)
    c.line(width/2 + 90, height - 165, width/2 + 200, height - 165)
    
    # 3. ID
    c.setFont(F_NORMAL, 12)
    c.drawCentredString(width / 2, height - 210, f"No. : {data.certificateId}")
    
    # 4. Recipient
    c.setFont(F_NORMAL, 16)
    c.drawCentredString(width / 2, height - 260, "Diberikan secara bangga kepada:")
    
    c.setFont(F_SERIF, 42)
    c.drawCentredString(width / 2, height - 320, data.userName)
    
    c.line(width/2 - 150, height - 340, width/2 + 150, height - 340)
    
    # 5. Course Details
    c.setFont(F_NORMAL, 14)
    c.drawCentredString(width / 2, height - 400, "Atas partisipasi aktif dan pencapaiannya dalam menyelesaikan program kursus:")
    
    c.setFont(F_TITLE, 20)
    c.drawCentredString(width / 2, height - 440, data.courseTitle)
    
    # Try parsing date, fallback to raw string
    try:
        dt = datetime.datetime.fromisoformat(data.completedAt.replace("Z", "+00:00"))
        date_str = dt.strftime("%d %B %Y")
    except:
        date_str = data.completedAt
        
    c.setFont(F_NORMAL, 14)
    c.drawCentredString(width / 2, height - 490, f"Diselesaikan pada tanggal : {date_str}")
    
    # 6. Signatures & QR
    
    # Generate QR Code for verification link (Optional functionality)
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(f"https://daharengineer.com/verify/{data.certificateId}")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR to a temporary file object so ReportLab can read it
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    c.drawImage(from_filelike(qr_buffer), 100, 60, width=80, height=80)
    c.setFont(F_NORMAL, 8)
    c.drawCentredString(140, 45, "Scan for Verification")
    
    # Right Signature
    sig_x = width - 200
    c.line(sig_x - 100, 100, sig_x + 100, 100)
    c.setFont(F_TITLE, 12)
    c.drawCentredString(sig_x, 85, "David Harly Rizky Prabudhi, S.T.")
    c.setFont(F_NORMAL, 10)
    c.drawCentredString(sig_x, 70, "Director of PT. Dahar Engineer Consultant")
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer

# Helper for loading Image from buffer in ReportLab
from reportlab.lib.utils import ImageReader
def from_filelike(fileobj):
    return ImageReader(fileobj)


# --- Helper: Sign PDF using pyHanko ---
def sign_pdf(pdf_buffer: io.BytesIO) -> io.BytesIO:
    """Takes a raw PDF buffer, signs it using pyHanko, and returns the signed PDF."""
    signed_buffer = io.BytesIO()
    
    # Check if dev cert exists
    cert_path = "certs/dev_cert.p12"
    if not os.path.exists(cert_path):
        raise Exception("Certificate not found. Run generate_cert.py first.")
        
    # Load signer from PKCS12
    signer = signers.SimpleSigner.load_pkcs12(cert_path, b"secret")
    
    # Prepare the Incremental Writer for PAdES signature
    pdf_writer = IncrementalPdfFileWriter(pdf_buffer)
    
    # Sign it!
    # By default, pyHanko produces an invisible signature (PAdES Basic)
    # which is computationally sound and validates in Adobe Reader.
    signers.sign_pdf(
        pdf_writer,
        signers.PdfSignatureMetadata(field_name='Signature1'),
        signer=signer,
        in_place=True
    )
    
    pdf_buffer.seek(0)
    return pdf_buffer


# --- Endpoints ---
@app.post("/generate-certificate")
async def generate_certificate(request: CertificateRequest):
    try:
        # Step 1: Generate the raw visual PDF
        raw_pdf_buffer = create_raw_certificate(request)
        
        # Step 2: Cryptographically sign the PDF
        signed_pdf_buffer = sign_pdf(raw_pdf_buffer)
        
        # Step 3: Return the bytes directly
        return Response(
            content=signed_pdf_buffer.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Certificate-{request.certificateId.replace('/', '-')}.pdf"
            }
        )
    except Exception as e:
        print(f"Error generating certificate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {"status": "healthy", "crypto": "available"}
