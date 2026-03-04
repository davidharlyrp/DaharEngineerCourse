import io
import os
from main import create_raw_certificate, CertificateRequest

def verify_layout():
    print("Generating test certificate for layout verification...")
    
    data = CertificateRequest(
        userName="Admin Dahar Engineer",
        courseTitle="Mastering Plaxis 2D for Geotechnical Engineering",
        completedAt="2026-03-04T00:00:00Z",
        certificateId="/DE/2026/OMI/0001"
    )
    
    try:
        pdf_buffer = create_raw_certificate(data)
        with open("test_layout_refined.pdf", "wb") as f:
            f.write(pdf_buffer.read())
        print("Success! Refined certificate saved to test_layout_refined.pdf")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_layout()
