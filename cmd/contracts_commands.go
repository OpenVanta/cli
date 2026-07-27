package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	ohttp "github.com/ogen-go/ogen/http"
	"github.com/spf13/cobra"
)

var contractsListPage paginationFlags

var contractsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List contracts",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListContractsParams{}
		if contractsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(contractsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(contractsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListContracts(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var contractsGetID string

var contractsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a contract by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetContract(
			cmd.Context(),
			vantaapi.GetContractParams{ContractId: contractsGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var contractsDeleteID string

var contractsDeleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a contract",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		if err := client.ogen.DeleteContract(
			cmd.Context(),
			vantaapi.DeleteContractParams{ContractId: contractsDeleteID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	contractsUploadFilePath     string
	contractsUploadExecutedDate string
	contractsUploadAccountID    string
)

var contractsUploadCmd = &cobra.Command{
	Use:   "upload",
	Short: "Upload a contract",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(contractsUploadFilePath) == "" {
			return fmt.Errorf("--file is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(contractsUploadFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.UploadContractReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
		}
		if executedDate := strings.TrimSpace(contractsUploadExecutedDate); executedDate != "" {
			req.ExecutedDate.SetTo(executedDate)
		}
		if accountID := strings.TrimSpace(contractsUploadAccountID); accountID != "" {
			req.AccountId.SetTo(accountID)
		}

		resp, err := client.ogen.UploadContract(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	contractsCmd.AddCommand(contractsListCmd)
	contractsListCmd.Flags().IntVar(&contractsListPage.pageSize, "page-size", 0, "Number of results to return")
	contractsListCmd.Flags().StringVar(&contractsListPage.pageCursor, "page-cursor", "", "Pagination cursor")

	contractsCmd.AddCommand(contractsGetCmd)
	contractsGetCmd.Flags().StringVar(&contractsGetID, "id", "", "Contract ID")
	_ = contractsGetCmd.MarkFlagRequired("id")

	contractsCmd.AddCommand(contractsDeleteCmd)
	contractsDeleteCmd.Flags().StringVar(&contractsDeleteID, "id", "", "Contract ID")
	_ = contractsDeleteCmd.MarkFlagRequired("id")

	contractsCmd.AddCommand(contractsUploadCmd)
	contractsUploadCmd.Flags().StringVar(&contractsUploadFilePath, "file", "", "Path to contract file to upload")
	contractsUploadCmd.Flags().StringVar(&contractsUploadExecutedDate, "executed-date", "", "ISO 8601 date when the contract was executed")
	contractsUploadCmd.Flags().StringVar(&contractsUploadAccountID, "account-id", "", "Customer trust account ID to associate with the contract")
	_ = contractsUploadCmd.MarkFlagRequired("file")
}
