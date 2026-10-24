"""Local blockchain adapter. Falls back cleanly when Hardhat is unavailable."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.config import PROJECT_ROOT, get_settings

ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "digest", "type": "bytes32"}],
        "name": "register",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "digest", "type": "bytes32"}],
        "name": "verify",
        "outputs": [
            {"internalType": "bool", "name": "exists", "type": "bool"},
            {"internalType": "address", "name": "registrar", "type": "address"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


def _digest_bytes32(digest_hex: str) -> bytes:
    clean = digest_hex.lower().replace("0x", "")
    return bytes.fromhex(clean)


@lru_cache
def _contract_address_from_artifact() -> str:
    deployed = PROJECT_ROOT / "blockchain" / "deployed.json"
    if deployed.exists():
        data = json.loads(deployed.read_text(encoding="utf-8"))
        return data.get("address") or ""
    return ""


def register_digest(digest_hex: str) -> dict:
    settings = get_settings()
    if not settings.blockchain_enabled:
        return {"ok": False, "message": "Blockchain adapter disabled."}
    try:
        from web3 import Web3

        w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url, request_kwargs={"timeout": 5}))
        if not w3.is_connected():
            return {"ok": False, "message": "Cannot connect to local blockchain RPC."}
        address = settings.blockchain_contract_address or _contract_address_from_artifact()
        if not address:
            return {"ok": False, "message": "Contract address is not configured."}
        account = w3.eth.account.from_key(settings.blockchain_private_key) if settings.blockchain_private_key else None
        if account is None:
            return {"ok": False, "message": "No blockchain private key configured for development."}
        contract = w3.eth.contract(address=Web3.to_checksum_address(address), abi=ABI)
        tx = contract.functions.register(_digest_bytes32(digest_hex)).build_transaction(
            {
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address),
                "gas": 200000,
                "gasPrice": w3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return {"ok": True, "tx_hash": receipt.transactionHash.hex()}
    except Exception as exc:
        return {"ok": False, "message": f"Blockchain registration failed: {exc.__class__.__name__}"}


def verify_digest(digest_hex: str) -> dict:
    settings = get_settings()
    if not settings.blockchain_enabled:
        return {"ok": False, "message": "Blockchain adapter disabled."}
    try:
        from web3 import Web3

        w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url, request_kwargs={"timeout": 5}))
        if not w3.is_connected():
            return {"ok": False, "message": "Cannot connect to local blockchain RPC."}
        address = settings.blockchain_contract_address or _contract_address_from_artifact()
        if not address:
            return {"ok": False, "message": "Contract address is not configured."}
        contract = w3.eth.contract(address=Web3.to_checksum_address(address), abi=ABI)
        exists, registrar, timestamp = contract.functions.verify(_digest_bytes32(digest_hex)).call()
        return {
            "ok": True,
            "exists": bool(exists),
            "registrar": registrar,
            "timestamp": int(timestamp),
        }
    except Exception:
        return {"ok": False, "message": "Blockchain verification failed."}
