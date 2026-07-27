package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var groupsListPage paginationFlags

var groupsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List groups",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListPersonGroupsParams{}
		if groupsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(groupsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(groupsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListPersonGroups(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var groupsGetID string

var groupsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a group by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetGroup(
			cmd.Context(),
			vantaapi.GetGroupParams{GroupId: groupsGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var groupsListPeopleID string

var groupsListPeopleCmd = &cobra.Command{
	Use:   "list-people",
	Short: "List people in a group",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetGroupMembers(
			cmd.Context(),
			vantaapi.GetGroupMembersParams{GroupId: groupsListPeopleID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	groupsAddPersonID   string
	groupsAddPersonJSON string
	groupsAddPersonFile string
)

var groupsAddPersonCmd = &cobra.Command{
	Use:   "add-person",
	Short: "Add a person to a group",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(groupsAddPersonJSON, groupsAddPersonFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.AddPersonToGroupReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddPersonToGroup(
			cmd.Context(),
			req,
			vantaapi.AddPersonToGroupParams{GroupId: groupsAddPersonID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	groupsRemovePersonID       string
	groupsRemovePersonPersonID string
)

var groupsRemovePersonCmd = &cobra.Command{
	Use:   "remove-person",
	Short: "Remove a person from a group",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.RemovePersonFromGroup(
			cmd.Context(),
			vantaapi.RemovePersonFromGroupParams{
				GroupId:  groupsRemovePersonID,
				PersonId: groupsRemovePersonPersonID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	groupsAddPeopleID   string
	groupsAddPeopleJSON string
	groupsAddPeopleFile string
)

var groupsAddPeopleCmd = &cobra.Command{
	Use:   "add-people",
	Short: "Add people to a group",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(groupsAddPeopleJSON, groupsAddPeopleFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.AddPeopleToGroupReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddPeopleToGroup(
			cmd.Context(),
			req,
			vantaapi.AddPeopleToGroupParams{GroupId: groupsAddPeopleID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	groupsRemovePeopleID   string
	groupsRemovePeopleJSON string
	groupsRemovePeopleFile string
)

var groupsRemovePeopleCmd = &cobra.Command{
	Use:   "remove-people",
	Short: "Remove people from a group",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(groupsRemovePeopleJSON, groupsRemovePeopleFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.RemovePeopleFromGroupReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.RemovePeopleFromGroup(
			cmd.Context(),
			req,
			vantaapi.RemovePeopleFromGroupParams{GroupId: groupsRemovePeopleID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	groupsCmd.AddCommand(groupsListCmd)
	groupsListCmd.Flags().IntVar(&groupsListPage.pageSize, "page-size", 0, "Number of results to return")
	groupsListCmd.Flags().StringVar(&groupsListPage.pageCursor, "page-cursor", "", "Pagination cursor")

	groupsCmd.AddCommand(groupsGetCmd)
	groupsGetCmd.Flags().StringVar(&groupsGetID, "id", "", "Group ID")
	_ = groupsGetCmd.MarkFlagRequired("id")

	groupsCmd.AddCommand(groupsListPeopleCmd)
	groupsListPeopleCmd.Flags().StringVar(&groupsListPeopleID, "id", "", "Group ID")
	_ = groupsListPeopleCmd.MarkFlagRequired("id")

	groupsCmd.AddCommand(groupsAddPersonCmd)
	groupsAddPersonCmd.Flags().StringVar(&groupsAddPersonID, "id", "", "Group ID")
	groupsAddPersonCmd.Flags().StringVar(&groupsAddPersonJSON, "json", "", "Raw JSON payload")
	groupsAddPersonCmd.Flags().StringVar(&groupsAddPersonFile, "file", "", "Path to JSON payload file")
	_ = groupsAddPersonCmd.MarkFlagRequired("id")

	groupsCmd.AddCommand(groupsRemovePersonCmd)
	groupsRemovePersonCmd.Flags().StringVar(&groupsRemovePersonID, "id", "", "Group ID")
	groupsRemovePersonCmd.Flags().StringVar(&groupsRemovePersonPersonID, "person-id", "", "Person ID")
	_ = groupsRemovePersonCmd.MarkFlagRequired("id")
	_ = groupsRemovePersonCmd.MarkFlagRequired("person-id")

	groupsCmd.AddCommand(groupsAddPeopleCmd)
	groupsAddPeopleCmd.Flags().StringVar(&groupsAddPeopleID, "id", "", "Group ID")
	groupsAddPeopleCmd.Flags().StringVar(&groupsAddPeopleJSON, "json", "", "Raw JSON payload")
	groupsAddPeopleCmd.Flags().StringVar(&groupsAddPeopleFile, "file", "", "Path to JSON payload file")
	_ = groupsAddPeopleCmd.MarkFlagRequired("id")

	groupsCmd.AddCommand(groupsRemovePeopleCmd)
	groupsRemovePeopleCmd.Flags().StringVar(&groupsRemovePeopleID, "id", "", "Group ID")
	groupsRemovePeopleCmd.Flags().StringVar(&groupsRemovePeopleJSON, "json", "", "Raw JSON payload")
	groupsRemovePeopleCmd.Flags().StringVar(&groupsRemovePeopleFile, "file", "", "Path to JSON payload file")
	_ = groupsRemovePeopleCmd.MarkFlagRequired("id")
}
