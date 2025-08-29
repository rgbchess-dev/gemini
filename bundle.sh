#!/bin/bash

# The name of the file we will create
OUTPUT_FILE="project_bundle.txt"

# Clear the file to start fresh
> "$OUTPUT_FILE"

echo "--- BUNDLING PROJECT FILES INTO $OUTPUT_FILE ---"

# Find all relevant files (html, css, js) in the current directory.
# -maxdepth 2 prevents it from going too deep into other folders if you have them.
find . -maxdepth 2 \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -print0 | while IFS= read -r -d $'\0' file; do
    
    # Ignore the bundle script itself
    if [[ "$file" == "./bundle.sh" ]]; then
        continue
    fi

    echo "" >> "$OUTPUT_FILE"
    echo "--- FILE: $file ---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
done

echo "--- BUNDLE COMPLETE ---"
echo "Your project has been bundled into: $OUTPUT_FILE"
