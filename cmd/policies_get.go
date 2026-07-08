package cmd

import (
	"github.com/VantaInc/cli/internal/vantaapi"
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

		resp, err := client.ogen.GetPolicy(
			cmd.Context(),
			vantaapi.GetPolicyParams{PolicyId: policyID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, resp)
	},
}

func init() {
	policiesCmd.AddCommand(policiesGetCmd)
	policiesGetCmd.Flags().StringVar(&policyID, "id", "", "Policy ID")
	_ = policiesGetCmd.MarkFlagRequired("id")
}
