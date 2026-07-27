package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	eventLogsListPage      paginationFlags
	eventLogsListStartDate string
)

var eventLogsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List event logs",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListEventLogsParams{}
		if eventLogsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(eventLogsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(eventLogsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if strings.TrimSpace(eventLogsListStartDate) != "" {
			parsed, err := parseRFC3339Flag("start-date", eventLogsListStartDate)
			if err != nil {
				return err
			}
			params.StartDate.SetTo(parsed)
		}

		resp, err := client.ogen.ListEventLogs(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	eventLogsCmd.AddCommand(eventLogsListCmd)
	eventLogsListCmd.Flags().IntVar(&eventLogsListPage.pageSize, "page-size", 0, "Number of results to return")
	eventLogsListCmd.Flags().StringVar(&eventLogsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	eventLogsListCmd.Flags().StringVar(&eventLogsListStartDate, "start-date", "", "Filter to event logs created at or after this RFC3339 timestamp")
}
