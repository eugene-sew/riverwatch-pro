import sys
import os
import subprocess

def main():
    print("=" * 60)
    print("  RiverWatch PRO — Standalone Forwarder Builder")
    print("=" * 60)

    # Ensure required dependencies are installed
    try:
        import PyInstaller
        import serial
        import requests
    except ImportError:
        print("Required build dependencies missing. Installing them now...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements-forwarder.txt"])
        except Exception as e:
            print(f"Error installing dependencies via pip: {e}")
            print("Please run: pip install -r requirements-forwarder.txt")
            sys.exit(1)

    import PyInstaller.__main__

    # Locate source file
    source_file = "bluetooth_reader.py"
    if not os.path.exists(source_file):
        source_file = os.path.join("riverwatch-backend", "bluetooth_reader.py")
        if not os.path.exists(source_file):
            print("Error: bluetooth_reader.py not found in current directory.")
            sys.exit(1)

    print(f"Building standalone executable from {source_file}...")

    # Configure PyInstaller arguments
    # --onefile packages everything into a single binary executable
    # --name gives the resulting binary a clean professional name
    # --console preserves terminal logging for live telemetry updates
    # --clean cleans the PyInstaller cache before building
    args = [
        source_file,
        '--onefile',
        '--name=RiverWatch-Forwarder',
        '--console',
        '--clean'
    ]

    try:
        PyInstaller.__main__.run(args)
        print("\n" + "=" * 60)
        print("  BUILD SUCCESSFUL! 🚀")
        print("  Your standalone executable is located in the 'dist' folder:")
        print("  - macOS / Linux:  dist/RiverWatch-Forwarder")
        print("  - Windows:        dist/RiverWatch-Forwarder.exe")
        print("=" * 60)
    except Exception as e:
        print(f"\nBuild failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
