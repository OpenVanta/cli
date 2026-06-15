package cmd

import (
	"net/http"
	"net/url"

	"github.com/VantaInc/cli/internal/vantaapi"
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

		if client.dryRun {
			path := "/controls/" + url.PathEscape(controlID)
			resp, err := client.request(cmd, http.MethodGet, path, nil)
			if err != nil {
				return err
			}
			return printJSON(cmd, resp)
		}

		resp, err := client.ogen.GetControl(cmd.Context(), vantaapi.GetControlParams{ControlId: controlID})
		if err != nil {
			return err
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsGetCmd)
	controlsGetCmd.Flags().StringVar(&controlID, "id", "", "Control ID")
	_ = controlsGetCmd.MarkFlagRequired("id")
}
