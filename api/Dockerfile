# Menggunakan image base Python 3.11 yang ringan
FROM python:3.11-slim

# Set working directory di dalam container
WORKDIR /app

# Menyalin file requirements.txt ke dalam container
COPY requirements.txt .

# Menginstal dependensi yang dibutuhkan
RUN pip install --no-cache-dir -r requirements.txt

# Menyalin seluruh kode aplikasi ke dalam container
COPY . .

# Membuat sertifikat dev_cert.p12 agar siap saat main.py membutuhkan tanda tangan digital
RUN python generate_cert.py

# Membuka port 4002 agar dapat diakses dari luar container
EXPOSE 4002

# Menentukan command untuk menjalankan FastAPI menggunakan Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4002"]
