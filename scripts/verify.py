#!/usr/bin/env python3
"""Thin shim — real checks live in scripts/verifier/ (one module per concern).
All documented commands (`python3 scripts/verify.py [--spec X] [--strict]`)
keep working unchanged.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from verifier.__main__ import main

if __name__ == "__main__":
    main()
