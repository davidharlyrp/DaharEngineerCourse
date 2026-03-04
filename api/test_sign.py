import io
import os
from pyhanko.sign import signers
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from reportlab.pdfgen import canvas

def test_sign():
    print("Starting test signing...")
    
    # 1. Create a simple PDF
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "Test PDF for Signing")
    c.save()
    buffer.seek(0)
    
    key_path = "certs/dev_key.pem"
    cert_path = "certs/dev_cert.pem"
    
    try:
        if os.path.exists(key_path) and os.path.exists(cert_path):
            print(f"Loading signer from PEM files...")
            signer = signers.SimpleSigner.load(key_path, cert_path)
        else:
            print(f"Loading signer from PKCS12...")
            signer = signers.SimpleSigner.load_pkcs12("certs/dev_cert.p12", b"secret")
        print("Signer loaded successfully.")
        
        pdf_writer = IncrementalPdfFileWriter(buffer)
        print("Starting PDF signing process...")
        signers.sign_pdf(
            pdf_writer,
            signers.PdfSignatureMetadata(field_name='Signature1'),
            signer=signer,
            in_place=True
        )
        print("PDF signed successfully!")
        
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Ensure we are in the api directory context if possible, or check paths
    if not os.path.exists("certs"):
        os.makedirs("certs", exist_ok=True)
    test_sign()
