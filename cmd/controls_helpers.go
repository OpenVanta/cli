package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

type paginationFlags struct {
	pageSize   int
	pageCursor string
}

func (f paginationFlags) apply(query url.Values) {
	if f.pageSize > 0 {
		query.Set("pageSize", strconv.Itoa(f.pageSize))
	}
	if strings.TrimSpace(f.pageCursor) != "" {
		query.Set("pageCursor", strings.TrimSpace(f.pageCursor))
	}
}

func readJSONPayload(jsonRaw, filePath string) ([]byte, error) {
	hasInline := strings.TrimSpace(jsonRaw) != ""
	hasFile := strings.TrimSpace(filePath) != ""
	if hasInline && hasFile {
		return nil, errors.New("pass either --json or --file, not both")
	}

	var payload []byte
	switch {
	case hasInline:
		payload = []byte(jsonRaw)
	case hasFile:
		raw, err := os.ReadFile(strings.TrimSpace(filePath))
		if err != nil {
			return nil, fmt.Errorf("read payload file: %w", err)
		}
		payload = raw
	default:
		return nil, errors.New("missing payload: pass --json or --file")
	}

	var value any
	if err := json.Unmarshal(payload, &value); err != nil {
		return nil, fmt.Errorf("invalid json payload: %w", err)
	}

	return payload, nil
}
