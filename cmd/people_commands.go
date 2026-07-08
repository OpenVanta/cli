package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	peopleListPage                 paginationFlags
	peopleTasksSummaryStatusFilter []string
	peopleTaskTypeFilter           []string
	peopleTaskStatusFilter         []string
)

var peopleListCmd = &cobra.Command{
	Use:   "list",
	Short: "List people",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListPeopleParams{}
		if peopleListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(peopleListPage.pageSize))
		}
		if cursor := strings.TrimSpace(peopleListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		for _, v := range peopleTasksSummaryStatusFilter {
			if trimmed := strings.TrimSpace(v); trimmed != "" {
				params.TasksSummaryStatusMatchesAny = append(
					params.TasksSummaryStatusMatchesAny,
					vantaapi.TasksSummaryStatus(trimmed),
				)
			}
		}
		for _, v := range peopleTaskTypeFilter {
			if trimmed := strings.TrimSpace(v); trimmed != "" {
				params.TaskTypeMatchesAny = append(
					params.TaskTypeMatchesAny,
					vantaapi.TaskType(trimmed),
				)
			}
		}
		for _, v := range peopleTaskStatusFilter {
			if trimmed := strings.TrimSpace(v); trimmed != "" {
				params.TaskStatusMatchesAny = append(
					params.TaskStatusMatchesAny,
					vantaapi.TaskStatus(trimmed),
				)
			}
		}

		resp, err := client.ogen.ListPeople(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var personID string

var peopleGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a person by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetPerson(
			cmd.Context(),
			vantaapi.GetPersonParams{PersonId: personID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	peopleUpdateID   string
	peopleUpdateJSON string
	peopleUpdateFile string
)

var peopleUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update person metadata",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(peopleUpdateJSON, peopleUpdateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdatePersonReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdatePerson(
			cmd.Context(),
			req,
			vantaapi.UpdatePersonParams{PersonId: peopleUpdateID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	peopleOffboardJSON string
	peopleOffboardFile string
)

var peopleOffboardCmd = &cobra.Command{
	Use:   "offboard",
	Short: "Offboard people",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(peopleOffboardJSON, peopleOffboardFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.OffboardPeopleReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.OffboardPeople(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	peopleMarkNotPeopleJSON string
	peopleMarkNotPeopleFile string
)

var peopleMarkNotPeopleCmd = &cobra.Command{
	Use:   "mark-as-not-people",
	Short: "Mark accounts as not people",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(peopleMarkNotPeopleJSON, peopleMarkNotPeopleFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.MarkAsNotPeopleReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.MarkAsNotPeople(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	peopleMarkPeopleJSON string
	peopleMarkPeopleFile string
)

var peopleMarkPeopleCmd = &cobra.Command{
	Use:   "mark-as-people",
	Short: "Mark accounts as people",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(peopleMarkPeopleJSON, peopleMarkPeopleFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.MarkAsPeopleReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.MarkAsPeople(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var peopleClearLeaveID string

var peopleClearLeaveCmd = &cobra.Command{
	Use:   "clear-leave",
	Short: "Clear leave status for a person",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		resp, err := client.ogen.ClearLeaveForPerson(
			cmd.Context(),
			vantaapi.ClearLeaveForPersonParams{PersonId: peopleClearLeaveID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	peopleSetLeaveID   string
	peopleSetLeaveJSON string
	peopleSetLeaveFile string
)

var peopleSetLeaveCmd = &cobra.Command{
	Use:   "set-leave",
	Short: "Set leave status for a person",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(peopleSetLeaveJSON, peopleSetLeaveFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.SetLeaveForPersonReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.SetLeaveForPerson(
			cmd.Context(),
			req,
			vantaapi.SetLeaveForPersonParams{PersonId: peopleSetLeaveID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	peopleCmd.AddCommand(peopleListCmd)
	peopleListCmd.Flags().IntVar(&peopleListPage.pageSize, "page-size", 0, "Number of results to return")
	peopleListCmd.Flags().StringVar(&peopleListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	peopleListCmd.Flags().StringSliceVar(&peopleTasksSummaryStatusFilter, "tasks-summary-status-matches-any", nil, "Tasks summary statuses to filter by (repeatable)")
	peopleListCmd.Flags().StringSliceVar(&peopleTaskTypeFilter, "task-type-matches-any", nil, "Task types to filter by (repeatable)")
	peopleListCmd.Flags().StringSliceVar(&peopleTaskStatusFilter, "task-status-matches-any", nil, "Task statuses to filter by (repeatable)")

	peopleCmd.AddCommand(peopleGetCmd)
	peopleGetCmd.Flags().StringVar(&personID, "id", "", "Person ID")
	_ = peopleGetCmd.MarkFlagRequired("id")

	peopleCmd.AddCommand(peopleUpdateCmd)
	peopleUpdateCmd.Flags().StringVar(&peopleUpdateID, "id", "", "Person ID")
	peopleUpdateCmd.Flags().StringVar(&peopleUpdateJSON, "json", "", "Raw JSON payload")
	peopleUpdateCmd.Flags().StringVar(&peopleUpdateFile, "file", "", "Path to JSON payload file")
	_ = peopleUpdateCmd.MarkFlagRequired("id")

	peopleCmd.AddCommand(peopleOffboardCmd)
	peopleOffboardCmd.Flags().StringVar(&peopleOffboardJSON, "json", "", "Raw JSON payload")
	peopleOffboardCmd.Flags().StringVar(&peopleOffboardFile, "file", "", "Path to JSON payload file")

	peopleCmd.AddCommand(peopleMarkNotPeopleCmd)
	peopleMarkNotPeopleCmd.Flags().StringVar(&peopleMarkNotPeopleJSON, "json", "", "Raw JSON payload")
	peopleMarkNotPeopleCmd.Flags().StringVar(&peopleMarkNotPeopleFile, "file", "", "Path to JSON payload file")

	peopleCmd.AddCommand(peopleMarkPeopleCmd)
	peopleMarkPeopleCmd.Flags().StringVar(&peopleMarkPeopleJSON, "json", "", "Raw JSON payload")
	peopleMarkPeopleCmd.Flags().StringVar(&peopleMarkPeopleFile, "file", "", "Path to JSON payload file")

	peopleCmd.AddCommand(peopleClearLeaveCmd)
	peopleClearLeaveCmd.Flags().StringVar(&peopleClearLeaveID, "id", "", "Person ID")
	_ = peopleClearLeaveCmd.MarkFlagRequired("id")

	peopleCmd.AddCommand(peopleSetLeaveCmd)
	peopleSetLeaveCmd.Flags().StringVar(&peopleSetLeaveID, "id", "", "Person ID")
	peopleSetLeaveCmd.Flags().StringVar(&peopleSetLeaveJSON, "json", "", "Raw JSON payload")
	peopleSetLeaveCmd.Flags().StringVar(&peopleSetLeaveFile, "file", "", "Path to JSON payload file")
	_ = peopleSetLeaveCmd.MarkFlagRequired("id")
}
