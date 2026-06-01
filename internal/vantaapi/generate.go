package vantaapi

//go:generate go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.7.0 --package vantaapi --generate types,client --include-tags Controls --o controls_client.gen.go ../../api-spec.yaml
