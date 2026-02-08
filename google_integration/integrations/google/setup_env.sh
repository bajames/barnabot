#!/bin/bash
# Setup script to ensure Google API packages are installed
# Run this if you get "No module named 'google'" errors

echo "Setting up Google API environment..."

# Install pip if not available
if ! python3 -m pip --version &>/dev/null; then
    echo "Installing pip..."
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3 - --break-system-packages
fi

# Install Google API packages
echo "Installing Google API packages..."
python3 -m pip install --break-system-packages \
    google-api-python-client \
    google-auth \
    google-auth-oauthlib \
    google-auth-httplib2

echo "✓ Setup complete!"
