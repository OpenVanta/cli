package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	knowledgeBaseListAnswersPage              paginationFlags
	knowledgeBaseListAnswersQ                 string
	knowledgeBaseListAnswersLastUpdatedAfter  string
	knowledgeBaseListAnswersLastUpdatedBefore string
	knowledgeBaseListAnswersMatchesTags       string
	knowledgeBaseListAnswersExpiresBefore     string
	knowledgeBaseListAnswersExpiresAfter      string
)

var knowledgeBaseListAnswersCmd = &cobra.Command{
	Use:   "list-answers",
	Short: "List answer library entries",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListAnswerLibraryEntriesParams{}
		if knowledgeBaseListAnswersPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(knowledgeBaseListAnswersPage.pageSize))
		}
		if cursor := strings.TrimSpace(knowledgeBaseListAnswersPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if q := strings.TrimSpace(knowledgeBaseListAnswersQ); q != "" {
			params.Q.SetTo(q)
		}
		if v := strings.TrimSpace(knowledgeBaseListAnswersLastUpdatedAfter); v != "" {
			params.LastUpdatedAfter.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListAnswersLastUpdatedBefore); v != "" {
			params.LastUpdatedBefore.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListAnswersMatchesTags); v != "" {
			params.MatchesTags.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListAnswersExpiresBefore); v != "" {
			params.ExpiresBefore.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListAnswersExpiresAfter); v != "" {
			params.ExpiresAfter.SetTo(v)
		}

		resp, err := client.ogen.ListAnswerLibraryEntries(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var knowledgeBaseGetAnswerID string

var knowledgeBaseGetAnswerCmd = &cobra.Command{
	Use:   "get-answer",
	Short: "Get an answer library entry by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetAnswerLibraryEntry(
			cmd.Context(),
			vantaapi.GetAnswerLibraryEntryParams{ID: knowledgeBaseGetAnswerID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseCreateAnswerJSON string
	knowledgeBaseCreateAnswerFile string
)

var knowledgeBaseCreateAnswerCmd = &cobra.Command{
	Use:   "create-answer",
	Short: "Create an answer library entry",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(knowledgeBaseCreateAnswerJSON, knowledgeBaseCreateAnswerFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateAnswerLibraryEntryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateAnswerLibraryEntry(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseUpdateAnswerID   string
	knowledgeBaseUpdateAnswerJSON string
	knowledgeBaseUpdateAnswerFile string
)

var knowledgeBaseUpdateAnswerCmd = &cobra.Command{
	Use:   "update-answer",
	Short: "Update an answer library entry",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(knowledgeBaseUpdateAnswerJSON, knowledgeBaseUpdateAnswerFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateAnswerLibraryEntryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateAnswerLibraryEntryRoute(
			cmd.Context(),
			req,
			vantaapi.UpdateAnswerLibraryEntryRouteParams{ID: knowledgeBaseUpdateAnswerID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var knowledgeBaseDeleteAnswerID string

var knowledgeBaseDeleteAnswerCmd = &cobra.Command{
	Use:   "delete-answer",
	Short: "Delete an answer library entry",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteAnswerLibraryEntryRoute(
			cmd.Context(),
			vantaapi.DeleteAnswerLibraryEntryRouteParams{ID: knowledgeBaseDeleteAnswerID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	knowledgeBaseVerifyAnswerID   string
	knowledgeBaseVerifyAnswerJSON string
	knowledgeBaseVerifyAnswerFile string
)

var knowledgeBaseVerifyAnswerCmd = &cobra.Command{
	Use:   "verify-answer",
	Short: "Verify an answer library entry",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		var body vantaapi.OptVerifyAnswerLibraryEntryInput
		if strings.TrimSpace(knowledgeBaseVerifyAnswerJSON) != "" || strings.TrimSpace(knowledgeBaseVerifyAnswerFile) != "" {
			payload, err := readJSONPayload(knowledgeBaseVerifyAnswerJSON, knowledgeBaseVerifyAnswerFile)
			if err != nil {
				return err
			}
			req, err := decodeRequestPayload[vantaapi.VerifyAnswerLibraryEntryInput](payload)
			if err != nil {
				return err
			}
			body.SetTo(*req)
		}

		resp, err := client.ogen.VerifyAnswerLibraryEntryRoute(
			cmd.Context(),
			body,
			vantaapi.VerifyAnswerLibraryEntryRouteParams{ID: knowledgeBaseVerifyAnswerID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	knowledgeBaseCmd.AddCommand(knowledgeBaseListAnswersCmd)
	knowledgeBaseListAnswersCmd.Flags().IntVar(&knowledgeBaseListAnswersPage.pageSize, "page-size", 0, "Number of results to return")
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersPage.pageCursor, "page-cursor", "", "Pagination cursor")
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersQ, "q", "", "Full-text search across question and answer")
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersLastUpdatedAfter, "last-updated-after", "", "Only include entries updated at or after this ISO 8601 timestamp")
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersLastUpdatedBefore, "last-updated-before", "", "Only include entries updated at or before this ISO 8601 timestamp")
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersMatchesTags, "matches-tags", "", `JSON-encoded array of {"categoryId","tagId"} pairs to filter by (OR filter)`)
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersExpiresBefore, "expires-before", "", "Only include entries expiring at or before this ISO 8601 timestamp")
	knowledgeBaseListAnswersCmd.Flags().StringVar(&knowledgeBaseListAnswersExpiresAfter, "expires-after", "", "Only include entries expiring at or after this ISO 8601 timestamp")

	knowledgeBaseCmd.AddCommand(knowledgeBaseGetAnswerCmd)
	knowledgeBaseGetAnswerCmd.Flags().StringVar(&knowledgeBaseGetAnswerID, "id", "", "Answer library entry ID")
	_ = knowledgeBaseGetAnswerCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseCreateAnswerCmd)
	knowledgeBaseCreateAnswerCmd.Flags().StringVar(&knowledgeBaseCreateAnswerJSON, "json", "", "Raw JSON payload")
	knowledgeBaseCreateAnswerCmd.Flags().StringVar(&knowledgeBaseCreateAnswerFile, "file", "", "Path to JSON payload file")

	knowledgeBaseCmd.AddCommand(knowledgeBaseUpdateAnswerCmd)
	knowledgeBaseUpdateAnswerCmd.Flags().StringVar(&knowledgeBaseUpdateAnswerID, "id", "", "Answer library entry ID")
	knowledgeBaseUpdateAnswerCmd.Flags().StringVar(&knowledgeBaseUpdateAnswerJSON, "json", "", "Raw JSON payload")
	knowledgeBaseUpdateAnswerCmd.Flags().StringVar(&knowledgeBaseUpdateAnswerFile, "file", "", "Path to JSON payload file")
	_ = knowledgeBaseUpdateAnswerCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseDeleteAnswerCmd)
	knowledgeBaseDeleteAnswerCmd.Flags().StringVar(&knowledgeBaseDeleteAnswerID, "id", "", "Answer library entry ID")
	_ = knowledgeBaseDeleteAnswerCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseVerifyAnswerCmd)
	knowledgeBaseVerifyAnswerCmd.Flags().StringVar(&knowledgeBaseVerifyAnswerID, "id", "", "Answer library entry ID")
	knowledgeBaseVerifyAnswerCmd.Flags().StringVar(&knowledgeBaseVerifyAnswerJSON, "json", "", "Raw JSON payload (optional; VerifyAnswerLibraryEntryInput)")
	knowledgeBaseVerifyAnswerCmd.Flags().StringVar(&knowledgeBaseVerifyAnswerFile, "file", "", "Path to JSON payload file (optional; VerifyAnswerLibraryEntryInput)")
	_ = knowledgeBaseVerifyAnswerCmd.MarkFlagRequired("id")
}
