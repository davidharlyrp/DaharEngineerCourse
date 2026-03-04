from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12
import datetime
import os

def generate_dev_certificate():
    print("Generating development RSA key and self-signed certificate...")
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    # Generate public key
    public_key = private_key.public_key()
    
    # Create certificate
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, u"ID"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"West Java"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, u"Bandung"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"PT. Dahar Engineer Consultant"),
        x509.NameAttribute(NameOID.COMMON_NAME, u"Dahar Engineer Dev Cert"),
    ])
    
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        public_key
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        # Valid for 1 year
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([x509.DNSName(u"localhost")]),
        critical=False,
    ).sign(private_key, hashes.SHA256())
    
    # Create required directory
    os.makedirs("certs", exist_ok=True)
    
    # Write PKCS#12 (PFX/P12 format) which pyHanko uses for signing
    # We'll use "secret" as the password for local dev
    p12 = pkcs12.serialize_key_and_certificates(
        b"dahar_dev_cert",
        private_key,
        cert,
        None,
        encryption_algorithm=serialization.BestAvailableEncryption(b"secret")
    )
    
    with open("certs/dev_cert.p12", "wb") as f:
        f.write(p12)
        
    print("Certificate generated at certs/dev_cert.p12 with password: 'secret'")

if __name__ == "__main__":
    generate_dev_certificate()
