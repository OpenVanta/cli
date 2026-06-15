package vantaapi

// Generate a typed Go API client from the root OpenAPI spec.
//
//go:generate go run github.com/ogen-go/ogen/cmd/ogen@latest -config ogen.yml --target . --package vantaapi ../../api-spec.yaml
