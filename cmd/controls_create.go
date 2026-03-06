package cmd

import (
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

		resp, err := client.request(cmd, http.MethodPost, "/controls", payload)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsCreateCmd)
	controlsCreateCmd.Flags().StringVar(&controlCreateJSON, "json", "", "Raw JSON payload")
	controlsCreateCmd.Flags().StringVar(&controlCreateFile, "file", "", "Path to JSON payload file")
}
