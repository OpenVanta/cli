package cmd

import (
	"fmt"
	"io"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
)

const trustCenterIDFlagUsage = "Trust Center slug ID"

// hasJSONPayloadFlags reports whether either payload flag was provided, so commands
// with an optional request body can skip readJSONPayload without erroring.
func hasJSONPayloadFlags(jsonRaw, filePath string) bool {
	return strings.TrimSpace(jsonRaw) != "" || strings.TrimSpace(filePath) != ""
}

func trustCentersMediaToBytes(resp vantaapi.GetTrustCenterResourceMediaRes) ([]byte, error) {
	if reader, ok := resp.(io.Reader); ok {
		raw, err := io.ReadAll(reader)
		if err != nil {
			return nil, fmt.Errorf("read media response: %w", err)
		}
		return raw, nil
	}

	if jsonResp, ok := resp.(*vantaapi.GetTrustCenterResourceMediaOKApplicationJSON); ok {
		return []byte(*jsonResp), nil
	}

	return nil, fmt.Errorf("unsupported media response type %T", resp)
}
