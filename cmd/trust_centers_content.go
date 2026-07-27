package cmd

import (
	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var trustCentersListFaqsID string

var trustCentersListFaqsCmd = &cobra.Command{
	Use:   "list-faqs",
	Short: "List Trust Center FAQs",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ListTrustCenterFaqs(
			cmd.Context(),
			vantaapi.ListTrustCenterFaqsParams{SlugId: trustCentersListFaqsID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetFaqID    string
	trustCentersGetFaqFaqID string
)

var trustCentersGetFaqCmd = &cobra.Command{
	Use:   "get-faq",
	Short: "Get a Trust Center FAQ",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterFaq(
			cmd.Context(),
			vantaapi.GetTrustCenterFaqParams{
				SlugId: trustCentersGetFaqID,
				FaqId:  trustCentersGetFaqFaqID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersCreateFaqID   string
	trustCentersCreateFaqJSON string
	trustCentersCreateFaqFile string
)

var trustCentersCreateFaqCmd = &cobra.Command{
	Use:   "create-faq",
	Short: "Create a Trust Center FAQ",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersCreateFaqJSON, trustCentersCreateFaqFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddOrEditTrustCenterFaqInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateTrustCenterFaq(
			cmd.Context(),
			req,
			vantaapi.CreateTrustCenterFaqParams{SlugId: trustCentersCreateFaqID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateFaqID    string
	trustCentersUpdateFaqFaqID string
	trustCentersUpdateFaqJSON  string
	trustCentersUpdateFaqFile  string
)

var trustCentersUpdateFaqCmd = &cobra.Command{
	Use:   "update-faq",
	Short: "Update a Trust Center FAQ",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateFaqJSON, trustCentersUpdateFaqFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddOrEditTrustCenterFaqInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterFaq(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterFaqParams{
				SlugId: trustCentersUpdateFaqID,
				FaqId:  trustCentersUpdateFaqFaqID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteFaqID    string
	trustCentersDeleteFaqFaqID string
)

var trustCentersDeleteFaqCmd = &cobra.Command{
	Use:   "delete-faq",
	Short: "Delete a Trust Center FAQ",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterFaq(
			cmd.Context(),
			vantaapi.DeleteTrustCenterFaqParams{
				SlugId: trustCentersDeleteFaqID,
				FaqId:  trustCentersDeleteFaqFaqID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var trustCentersListSubprocessorsID string

var trustCentersListSubprocessorsCmd = &cobra.Command{
	Use:   "list-subprocessors",
	Short: "List Trust Center subprocessors",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ListTrustCenterSubprocessors(
			cmd.Context(),
			vantaapi.ListTrustCenterSubprocessorsParams{SlugId: trustCentersListSubprocessorsID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetSubprocessorID             string
	trustCentersGetSubprocessorSubprocessorID string
)

var trustCentersGetSubprocessorCmd = &cobra.Command{
	Use:   "get-subprocessor",
	Short: "Get a Trust Center subprocessor",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterSubprocessor(
			cmd.Context(),
			vantaapi.GetTrustCenterSubprocessorParams{
				SlugId:         trustCentersGetSubprocessorID,
				SubprocessorId: trustCentersGetSubprocessorSubprocessorID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersCreateSubprocessorID   string
	trustCentersCreateSubprocessorJSON string
	trustCentersCreateSubprocessorFile string
)

var trustCentersCreateSubprocessorCmd = &cobra.Command{
	Use:   "create-subprocessor",
	Short: "Create a Trust Center subprocessor",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersCreateSubprocessorJSON, trustCentersCreateSubprocessorFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddTrustCenterSubprocessorInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateTrustCenterSubprocessor(
			cmd.Context(),
			req,
			vantaapi.CreateTrustCenterSubprocessorParams{SlugId: trustCentersCreateSubprocessorID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateSubprocessorID             string
	trustCentersUpdateSubprocessorSubprocessorID string
	trustCentersUpdateSubprocessorJSON           string
	trustCentersUpdateSubprocessorFile           string
)

var trustCentersUpdateSubprocessorCmd = &cobra.Command{
	Use:   "update-subprocessor",
	Short: "Update a Trust Center subprocessor",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateSubprocessorJSON, trustCentersUpdateSubprocessorFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.EditTrustCenterSubprocessorInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterSubprocessor(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterSubprocessorParams{
				SlugId:         trustCentersUpdateSubprocessorID,
				SubprocessorId: trustCentersUpdateSubprocessorSubprocessorID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteSubprocessorID             string
	trustCentersDeleteSubprocessorSubprocessorID string
)

var trustCentersDeleteSubprocessorCmd = &cobra.Command{
	Use:   "delete-subprocessor",
	Short: "Delete a Trust Center subprocessor",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterSubprocessor(
			cmd.Context(),
			vantaapi.DeleteTrustCenterSubprocessorParams{
				SlugId:         trustCentersDeleteSubprocessorID,
				SubprocessorId: trustCentersDeleteSubprocessorSubprocessorID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func init() {
	trustCentersCmd.AddCommand(trustCentersListFaqsCmd)
	trustCentersListFaqsCmd.Flags().StringVar(&trustCentersListFaqsID, "id", "", trustCenterIDFlagUsage)
	_ = trustCentersListFaqsCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetFaqCmd)
	trustCentersGetFaqCmd.Flags().StringVar(&trustCentersGetFaqID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetFaqCmd.Flags().StringVar(&trustCentersGetFaqFaqID, "faq-id", "", "FAQ ID")
	_ = trustCentersGetFaqCmd.MarkFlagRequired("id")
	_ = trustCentersGetFaqCmd.MarkFlagRequired("faq-id")

	trustCentersCmd.AddCommand(trustCentersCreateFaqCmd)
	trustCentersCreateFaqCmd.Flags().StringVar(&trustCentersCreateFaqID, "id", "", trustCenterIDFlagUsage)
	trustCentersCreateFaqCmd.Flags().StringVar(&trustCentersCreateFaqJSON, "json", "", "Raw JSON payload")
	trustCentersCreateFaqCmd.Flags().StringVar(&trustCentersCreateFaqFile, "file", "", "Path to JSON payload file")
	_ = trustCentersCreateFaqCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateFaqCmd)
	trustCentersUpdateFaqCmd.Flags().StringVar(&trustCentersUpdateFaqID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateFaqCmd.Flags().StringVar(&trustCentersUpdateFaqFaqID, "faq-id", "", "FAQ ID")
	trustCentersUpdateFaqCmd.Flags().StringVar(&trustCentersUpdateFaqJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateFaqCmd.Flags().StringVar(&trustCentersUpdateFaqFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateFaqCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateFaqCmd.MarkFlagRequired("faq-id")

	trustCentersCmd.AddCommand(trustCentersDeleteFaqCmd)
	trustCentersDeleteFaqCmd.Flags().StringVar(&trustCentersDeleteFaqID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteFaqCmd.Flags().StringVar(&trustCentersDeleteFaqFaqID, "faq-id", "", "FAQ ID")
	_ = trustCentersDeleteFaqCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteFaqCmd.MarkFlagRequired("faq-id")

	trustCentersCmd.AddCommand(trustCentersListSubprocessorsCmd)
	trustCentersListSubprocessorsCmd.Flags().StringVar(&trustCentersListSubprocessorsID, "id", "", trustCenterIDFlagUsage)
	_ = trustCentersListSubprocessorsCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetSubprocessorCmd)
	trustCentersGetSubprocessorCmd.Flags().StringVar(&trustCentersGetSubprocessorID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetSubprocessorCmd.Flags().StringVar(&trustCentersGetSubprocessorSubprocessorID, "subprocessor-id", "", "Subprocessor ID")
	_ = trustCentersGetSubprocessorCmd.MarkFlagRequired("id")
	_ = trustCentersGetSubprocessorCmd.MarkFlagRequired("subprocessor-id")

	trustCentersCmd.AddCommand(trustCentersCreateSubprocessorCmd)
	trustCentersCreateSubprocessorCmd.Flags().StringVar(&trustCentersCreateSubprocessorID, "id", "", trustCenterIDFlagUsage)
	trustCentersCreateSubprocessorCmd.Flags().StringVar(&trustCentersCreateSubprocessorJSON, "json", "", "Raw JSON payload")
	trustCentersCreateSubprocessorCmd.Flags().StringVar(&trustCentersCreateSubprocessorFile, "file", "", "Path to JSON payload file")
	_ = trustCentersCreateSubprocessorCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateSubprocessorCmd)
	trustCentersUpdateSubprocessorCmd.Flags().StringVar(&trustCentersUpdateSubprocessorID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateSubprocessorCmd.Flags().StringVar(&trustCentersUpdateSubprocessorSubprocessorID, "subprocessor-id", "", "Subprocessor ID")
	trustCentersUpdateSubprocessorCmd.Flags().StringVar(&trustCentersUpdateSubprocessorJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateSubprocessorCmd.Flags().StringVar(&trustCentersUpdateSubprocessorFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateSubprocessorCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateSubprocessorCmd.MarkFlagRequired("subprocessor-id")

	trustCentersCmd.AddCommand(trustCentersDeleteSubprocessorCmd)
	trustCentersDeleteSubprocessorCmd.Flags().StringVar(&trustCentersDeleteSubprocessorID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteSubprocessorCmd.Flags().StringVar(&trustCentersDeleteSubprocessorSubprocessorID, "subprocessor-id", "", "Subprocessor ID")
	_ = trustCentersDeleteSubprocessorCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteSubprocessorCmd.MarkFlagRequired("subprocessor-id")
}
