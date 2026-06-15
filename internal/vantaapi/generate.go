package vantaapi

// Generate a typed Go API client from the root OpenAPI spec.
//
//go:generate go run github.com/ogen-go/ogen/cmd/ogen@v1.21.0 -config ogen.yml --target . --package vantaapi ../../api-spec.yaml
