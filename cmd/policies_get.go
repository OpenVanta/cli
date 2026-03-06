package cmd

import (
	"net/http"
	"net/url"

	"github.com/spf13/cobra"
)

var policyID string

var policiesGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a policy by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/policies/" + url.PathEscape(policyID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	policiesCmd.AddCommand(policiesGetCmd)
	policiesGetCmd.Flags().StringVar(&policyID, "id", "", "Policy ID")
	_ = policiesGetCmd.MarkFlagRequired("id")
}
