#!/bin/bash

# Fix imports in @evm package to use relative paths within the package
# and keep @/ for imports from the core app

cd packages/@evm/src

# Fix imports from @/config/ to relative
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/config/contracts"|from "../../config/contracts"|g' \
  -e 's|from "@/config/chains"|from "../../config/chains"|g' \
  {} \;

# Fix imports in hooks/actions
find ./hooks/actions -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/hooks/core/useContracts"|from "../core/useContracts"|g' \
  -e 's|from "@/hooks/core/useSliceAccount"|from "../core/useSliceAccount"|g' \
  {} \;

# Fix imports in hooks/disputes
find ./hooks/disputes -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/hooks/core/useContracts"|from "../core/useContracts"|g' \
  -e 's|from "@/hooks/core/useSliceAccount"|from "../core/useSliceAccount"|g' \
  {} \;

# Fix imports in hooks/voting
find ./hooks/voting -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/hooks/core/useContracts"|from "../core/useContracts"|g' \
  -e 's|from "@/hooks/core/useSliceAccount"|from "../core/useSliceAccount"|g' \
  {} \;

# Fix imports in hooks/user
find ./hooks/user -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/hooks/core/useSliceAccount"|from "../core/useSliceAccount"|g' \
  {} \;

# Fix contracts imports
find ./config -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/contracts/slice-abi"|from "../contracts/abis/slice-abi"|g' \
  -e 's|from "@/contracts/erc20-abi"|from "../contracts/abis/erc20-abi"|g' \
  {} \;

# Fix useSliceConnect
sed -i '' \
  -e 's|from "@/hooks/core/useSliceAccount"|from "./core/useSliceAccount"|g' \
  ./hooks/useSliceConnect.ts

echo "Import fixes applied!"
