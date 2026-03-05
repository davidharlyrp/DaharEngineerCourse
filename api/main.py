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
    "https://course.daharengineer.com",
    "https://admin.daharengineer.com",
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
    
    # 2. Top Branding Header (Compact & Horizontal)
    logo_path = os.path.join(os.path.dirname(__file__), "..", "public", "logo.png")
    brand_text = "DAHAR ENGINEER"
    
    # Calculate centering for both logo and text
    header_y = height - 90
    c.setFont(F_TITLE, 14)
    text_width = c.stringWidth(brand_text, F_TITLE, 14)
    logo_size = 20
    gap = 8
    total_header_width = logo_size + gap + text_width
    start_x = (width - total_header_width) / 2
    
    if os.path.exists(logo_path):
        c.drawImage(logo_path, start_x, header_y - 4, width=logo_size, height=logo_size, mask='auto')
    
    c.drawString(start_x + logo_size + gap, header_y, brand_text)
    
    # 3. Header Title (Compact)
    c.setFont(F_TITLE, 42)
    c.drawCentredString(width / 2, height - 150, "SERTIFIKAT")
    
    c.setFont(F_NORMAL, 12)
    c.drawCentredString(width / 2, height - 175, "P E N G H A R G A A N")
    
    # Draw Lines around PENGHARGAAN
    c.setStrokeColorRGB(*c_dark_blue, alpha=0.3)
    c.setLineWidth(1)
    c.line(width/2 - 180, height - 171, width/2 - 80, height - 171)
    c.line(width/2 + 80, height - 171, width/2 + 180, height - 171)
    
    # 4. ID (Reduced gap)
    c.setFont(F_NORMAL, 11)
    c.drawCentredString(width / 2, height - 210, f"No. : {data.certificateId}")
    
    # 5. Recipient (Compact)
    c.setFont(F_NORMAL, 14)
    c.drawCentredString(width / 2, height - 250, "Diberikan secara bangga kepada:")
    
    c.setFont(F_SERIF, 38)
    c.drawCentredString(width / 2, height - 300, data.userName)
    
    c.setLineWidth(0.5)
    c.line(width/2 - 140, height - 315, width/2 + 140, height - 315)
    
    # 6. Course Details (Compact)
    c.setFont(F_NORMAL, 13)
    c.drawCentredString(width / 2, height - 355, "Atas partisipasi aktif dan pencapaiannya dalam menyelesaikan program kursus:")
    
    c.setFont(F_TITLE, 18)
    c.drawCentredString(width / 2, height - 385, data.courseTitle)
    
    # Try parsing date
    try:
        dt = datetime.datetime.fromisoformat(data.completedAt.replace("Z", "+00:00"))
        date_str = dt.strftime("%d %B %Y")
    except:
        date_str = data.completedAt
        
    c.setFont(F_NORMAL, 13)
    c.drawCentredString(width / 2, height - 425, f"Diselesaikan pada tanggal : {date_str}")
    
    # 7. Signature & QR (Refined positions)
    sig_x = width - 200
    base_sig_y = 70
    
    # Generate QR Code
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(f"https://daharengineer.com/verify/{data.certificateId}")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # QR code more compact
    c.drawImage(from_filelike(qr_buffer), sig_x - 30, base_sig_y + 45, width=60, height=60)
    
    c.setFont(F_NORMAL, 6)
    c.drawCentredString(sig_x, base_sig_y + 40, "Digital Signature")
    
    # Signature Right
    c.line(sig_x - 100, base_sig_y + 30, sig_x + 100, base_sig_y + 30)
    c.setFont(F_TITLE, 11)
    c.drawCentredString(sig_x, base_sig_y + 16, "David Harly Rizky Prabudhi, S.T.")
    c.setFont(F_NORMAL, 9)
    c.drawCentredString(sig_x, base_sig_y + 2, "Director of PT. Dahar Engineer Consultant")
    
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
    
    # Try loading from PEM files (more robust on Windows)
    key_path = "certs/dev_key.pem"
    cert_path = "certs/dev_cert.pem"
    
    if os.path.exists(key_path) and os.path.exists(cert_path):
        signer = signers.SimpleSigner.load(key_path, cert_path)
    else:
        # Fallback to PKCS12
        cert_p12_path = "certs/dev_cert.p12"
        if not os.path.exists(cert_p12_path):
            raise Exception("Certificates not found. Run generate_cert.py first.")
        signer = signers.SimpleSigner.load_pkcs12(cert_p12_path, b"secret")
    
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
def generate_certificate(request: CertificateRequest):
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
