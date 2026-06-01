package cmd

import (
	"bytes"
	"fmt"
	"net/http"

	"github.com/spf13/cobra"
)

var (
	controlCreateJSON string
	controlCreateFile string
)

var controlsCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(controlCreateJSON, controlCreateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		var resp []byte
		if client.dryRun {
			resp, err = client.request(cmd, http.MethodPost, "/controls", payload)
			if err != nil {
				return err
			}
		} else {
			controlsClient, err := client.newControlsGeneratedClient(cmd)
			if err != nil {
				return fmt.Errorf("build generated controls client: %w", err)
			}
			httpResp, err := controlsClient.CreateCustomControlWithBody(cmd.Context(), "application/json", bytes.NewReader(payload))
			if err != nil {
				return fmt.Errorf("send request: %w", err)
			}
			resp, err = client.readResponse(cmd, httpResp)
			if err != nil {
				return err
			}
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsCreateCmd)
	controlsCreateCmd.Flags().StringVar(&controlCreateJSON, "json", "", "Raw JSON payload")
	controlsCreateCmd.Flags().StringVar(&controlCreateFile, "file", "", "Path to JSON payload file")
}
