#!/usr/bin/env bash

rm -rf build/*
mkdir -p build/

zip -r9 build/aws-linker.zip \
    icon.png \
    injected.js \
    LICENSE \
    manifest.json \
    options.html \
    options.js \
    popup.html \
    popup.js \
    README.md \
    vendor/*
