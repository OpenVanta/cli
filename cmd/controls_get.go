package cmd

import (
	"net/http"
	"net/url"

	"github.com/spf13/cobra"
)

var controlID string

var controlsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a control by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsGetCmd)
	controlsGetCmd.Flags().StringVar(&controlID, "id", "", "Control ID")
	_ = controlsGetCmd.MarkFlagRequired("id")
}
