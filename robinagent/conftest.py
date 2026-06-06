"""
pytest yardımcı dosyası.

Testler `import core.progress` diyebilsin diye robinagent/ klasörünü
import yoluna ekler. pytest bu dosyayı testlerden önce otomatik çalıştırır,
böylece testleri nereden çalıştırdığın fark etmez.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
