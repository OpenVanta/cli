package vantaapi

// Generate a typed Go API client from the root OpenAPI spec.
//
//go:generate bash ../../scripts/prepare-openapi-for-ogen.sh ../../api-spec.json ../../api-spec.codegen.json
//go:generate go run github.com/ogen-go/ogen/cmd/ogen@v1.21.0 -config ogen.yml --target . --package vantaapi ../../api-spec.codegen.json
