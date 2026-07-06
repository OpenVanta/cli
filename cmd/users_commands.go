package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var usersListPage paginationFlags

var usersListCmd = &cobra.Command{
	Use:   "list",
	Short: "List active users",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListUsersParams{}
		if usersListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(usersListPage.pageSize))
		}
		if cursor := strings.TrimSpace(usersListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListUsers(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var usersGetID string

var usersGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a user by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetUser(
			cmd.Context(),
			vantaapi.GetUserParams{UserId: usersGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	usersCmd.AddCommand(usersListCmd)
	usersListCmd.Flags().IntVar(&usersListPage.pageSize, "page-size", 0, "Number of results to return")
	usersListCmd.Flags().StringVar(&usersListPage.pageCursor, "page-cursor", "", "Pagination cursor")

	usersCmd.AddCommand(usersGetCmd)
	usersGetCmd.Flags().StringVar(&usersGetID, "id", "", "User ID")
	_ = usersGetCmd.MarkFlagRequired("id")
}
