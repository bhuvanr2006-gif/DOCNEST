from __future__ import annotations

import base64
import hashlib
import os
import secrets
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _master_key() -> bytes:
    settings = get_settings()
    raw = settings.docnest_master_key.strip()
    if not raw:
        raise RuntimeError(
            "DOCNEST_MASTER_KEY is not set. Generate a 32-byte key and store it as base64."
        )
    try:
        key = base64.b64decode(raw)
    except Exception as exc:
        raise RuntimeError("DOCNEST_MASTER_KEY must be valid base64") from exc
    if len(key) != 32:
        raise RuntimeError("DOCNEST_MASTER_KEY must decode to 32 bytes for AES-256")
    return key


def generate_dek() -> bytes:
    return secrets.token_bytes(32)


def wrap_dek(dek: bytes) -> tuple[str, str]:
    nonce = os.urandom(12)
    wrapped = AESGCM(_master_key()).encrypt(nonce, dek, None)
    return base64.b64encode(wrapped).decode(), base64.b64encode(nonce).decode()


def unwrap_dek(wrapped_b64: str, nonce_b64: str) -> bytes:
    wrapped = base64.b64decode(wrapped_b64)
    nonce = base64.b64decode(nonce_b64)
    return AESGCM(_master_key()).decrypt(nonce, wrapped, None)


def encrypt_bytes(plaintext: bytes, dek: bytes) -> bytes:
    nonce = os.urandom(12)
    ciphertext = AESGCM(dek).encrypt(nonce, plaintext, None)
    return nonce + ciphertext


def decrypt_bytes(blob: bytes, dek: bytes) -> bytes:
    nonce, ciphertext = blob[:12], blob[12:]
    return AESGCM(dek).decrypt(nonce, ciphertext, None)


def encrypt_and_store(plaintext: bytes, dest: Path, wrapped_key: str, wrap_nonce: str) -> None:
    dek = unwrap_dek(wrapped_key, wrap_nonce)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(encrypt_bytes(plaintext, dek))


def load_and_decrypt(src: Path, wrapped_key: str, wrap_nonce: str) -> bytes:
    dek = unwrap_dek(wrapped_key, wrap_nonce)
    return decrypt_bytes(src.read_bytes(), dek)
