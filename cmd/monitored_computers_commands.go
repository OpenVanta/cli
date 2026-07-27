package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	monitoredComputersListPage                paginationFlags
	monitoredComputersComplianceStatusFilters []string
)

var monitoredComputersListCmd = &cobra.Command{
	Use:   "list",
	Short: "List monitored computers",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListMonitoredComputersParams{}
		if monitoredComputersListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(monitoredComputersListPage.pageSize))
		}
		if cursor := strings.TrimSpace(monitoredComputersListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		for _, status := range monitoredComputersComplianceStatusFilters {
			if trimmed := strings.TrimSpace(status); trimmed != "" {
				params.ComplianceStatusFilterMatchesAny = append(
					params.ComplianceStatusFilterMatchesAny,
					vantaapi.ComputerStatusFilter(trimmed),
				)
			}
		}

		resp, err := client.ogen.ListMonitoredComputers(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var monitoredComputersGetID string

var monitoredComputersGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a monitored computer by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetMonitoredComputer(
			cmd.Context(),
			vantaapi.GetMonitoredComputerParams{ComputerId: monitoredComputersGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	monitoredComputersCmd.AddCommand(monitoredComputersListCmd)
	monitoredComputersListCmd.Flags().IntVar(&monitoredComputersListPage.pageSize, "page-size", 0, "Number of results to return")
	monitoredComputersListCmd.Flags().StringVar(&monitoredComputersListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	monitoredComputersListCmd.Flags().StringSliceVar(
		&monitoredComputersComplianceStatusFilters,
		"compliance-status-filter-matches-any",
		nil,
		"Compliance statuses to filter by (repeatable): PWM_NOT_INSTALLED, HD_NOT_ENCRYPTED, AV_NOT_INSTALLED, SCREENLOCK_NOT_CONFIGURED, LAST_CHECK_OVER_14_DAYS",
	)

	monitoredComputersCmd.AddCommand(monitoredComputersGetCmd)
	monitoredComputersGetCmd.Flags().StringVar(&monitoredComputersGetID, "id", "", "Monitored computer ID")
	_ = monitoredComputersGetCmd.MarkFlagRequired("id")
}
