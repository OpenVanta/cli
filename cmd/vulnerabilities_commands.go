package cmd

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	vulnerabilitiesListPage                    paginationFlags
	vulnerabilitiesListQ                       string
	vulnerabilitiesListIsDeactivated           string
	vulnerabilitiesListExternalVulnerabilityID string
	vulnerabilitiesListIsFixAvailable          string
	vulnerabilitiesListPackageIdentifier       string
	vulnerabilitiesListSLADeadlineAfterDate    string
	vulnerabilitiesListSLADeadlineBeforeDate   string
	vulnerabilitiesListSeverity                string
	vulnerabilitiesListIntegrationID           string
	vulnerabilitiesListIncludeWithoutSLAs      string
	vulnerabilitiesListVulnerableAssetID       string
	vulnerabilitiesDeactivateJSON              string
	vulnerabilitiesDeactivateFile              string
	vulnerabilitiesReactivateJSON              string
	vulnerabilitiesReactivateFile              string
)

var vulnerabilitiesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List vulnerabilities",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListVulnerabilitiesParams{}
		if vulnerabilitiesListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vulnerabilitiesListPage.pageSize))
		}
		if cursor := strings.TrimSpace(vulnerabilitiesListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if query := strings.TrimSpace(vulnerabilitiesListQ); query != "" {
			params.Q.SetTo(query)
		}
		if externalID := strings.TrimSpace(vulnerabilitiesListExternalVulnerabilityID); externalID != "" {
			params.ExternalVulnerabilityId.SetTo(externalID)
		}
		if packageIdentifier := strings.TrimSpace(vulnerabilitiesListPackageIdentifier); packageIdentifier != "" {
			params.PackageIdentifier.SetTo(packageIdentifier)
		}
		if integrationID := strings.TrimSpace(vulnerabilitiesListIntegrationID); integrationID != "" {
			params.IntegrationId.SetTo(integrationID)
		}
		if vulnerableAssetID := strings.TrimSpace(vulnerabilitiesListVulnerableAssetID); vulnerableAssetID != "" {
			params.VulnerableAssetId.SetTo(vulnerableAssetID)
		}

		if err := setOptionalBoolOpt(
			&params.IsDeactivated,
			vulnerabilitiesListIsDeactivated,
			"is-deactivated",
		); err != nil {
			return err
		}
		if err := setOptionalBoolOpt(
			&params.IsFixAvailable,
			vulnerabilitiesListIsFixAvailable,
			"is-fix-available",
		); err != nil {
			return err
		}
		if err := setOptionalBoolOpt(
			&params.IncludeVulnerabilitiesWithoutSlas,
			vulnerabilitiesListIncludeWithoutSLAs,
			"include-vulnerabilities-without-slas",
		); err != nil {
			return err
		}

		if strings.TrimSpace(vulnerabilitiesListSLADeadlineAfterDate) != "" {
			parsed, err := parseRFC3339Flag(
				"sla-deadline-after-date",
				vulnerabilitiesListSLADeadlineAfterDate,
			)
			if err != nil {
				return err
			}
			params.SlaDeadlineAfterDate.SetTo(parsed)
		}
		if strings.TrimSpace(vulnerabilitiesListSLADeadlineBeforeDate) != "" {
			parsed, err := parseRFC3339Flag(
				"sla-deadline-before-date",
				vulnerabilitiesListSLADeadlineBeforeDate,
			)
			if err != nil {
				return err
			}
			params.SlaDeadlineBeforeDate.SetTo(parsed)
		}

		if severityRaw := strings.TrimSpace(vulnerabilitiesListSeverity); severityRaw != "" {
			severity := vantaapi.ExternalFindingSeverity(severityRaw)
			if err := severity.Validate(); err != nil {
				return fmt.Errorf(
					"invalid --severity %q (expected one of: CRITICAL, HIGH, MEDIUM, LOW)",
					severityRaw,
				)
			}
			params.Severity.SetTo(severity)
		}

		resp, err := client.ogen.ListVulnerabilities(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var vulnerabilitiesGetID string

var vulnerabilitiesGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a vulnerability by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetVulnerability(
			cmd.Context(),
			vantaapi.GetVulnerabilityParams{VulnerabilityId: vulnerabilitiesGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var vulnerabilitiesDeactivateCmd = &cobra.Command{
	Use:   "deactivate",
	Short: "Deactivate vulnerabilities",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(vulnerabilitiesDeactivateJSON, vulnerabilitiesDeactivateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.DeactivateVulnerabilitiesReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.DeactivateVulnerabilities(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var vulnerabilitiesReactivateCmd = &cobra.Command{
	Use:   "reactivate",
	Short: "Reactivate vulnerabilities",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(vulnerabilitiesReactivateJSON, vulnerabilitiesReactivateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.ReactivateVulnerabilitiesReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ReactivateVulnerabilities(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func setOptionalBoolOpt(target *vantaapi.OptBool, rawValue string, flagName string) error {
	if strings.TrimSpace(rawValue) == "" {
		return nil
	}
	parsed, err := strconv.ParseBool(strings.TrimSpace(rawValue))
	if err != nil {
		return fmt.Errorf("invalid value for --%s: %q (expected true or false)", flagName, rawValue)
	}
	target.SetTo(parsed)
	return nil
}

func parseRFC3339Flag(flagName, value string) (time.Time, error) {
	parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(value))
	if err != nil {
		return time.Time{}, fmt.Errorf(
			"invalid --%s: %q (expected RFC3339 like 2026-01-02T15:04:05Z)",
			flagName,
			value,
		)
	}
	return parsed, nil
}

func init() {
	vulnerabilitiesCmd.AddCommand(vulnerabilitiesListCmd)
	vulnerabilitiesListCmd.Flags().IntVar(&vulnerabilitiesListPage.pageSize, "page-size", 0, "Number of results to return")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListQ, "q", "", "Filter vulnerabilities by search query")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListIsDeactivated, "is-deactivated", "", "Filter vulnerabilities by deactivation status (true/false)")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListExternalVulnerabilityID, "external-vulnerability-id", "", "Filter vulnerabilities by external vulnerability ID")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListIsFixAvailable, "is-fix-available", "", "Filter vulnerabilities by available fix status (true/false)")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListPackageIdentifier, "package-identifier", "", "Filter vulnerabilities by package identifier")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListSLADeadlineAfterDate, "sla-deadline-after-date", "", "Filter vulnerabilities with SLA deadline after this RFC3339 timestamp")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListSLADeadlineBeforeDate, "sla-deadline-before-date", "", "Filter vulnerabilities with SLA deadline before this RFC3339 timestamp")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListSeverity, "severity", "", "Filter vulnerabilities by severity (CRITICAL, HIGH, MEDIUM, LOW)")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListIntegrationID, "integration-id", "", "Filter vulnerabilities by vulnerability scanner integration ID")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListIncludeWithoutSLAs, "include-vulnerabilities-without-slas", "", "Include vulnerabilities without SLA dates (true/false)")
	vulnerabilitiesListCmd.Flags().StringVar(&vulnerabilitiesListVulnerableAssetID, "vulnerable-asset-id", "", "Filter vulnerabilities by vulnerable asset ID")

	vulnerabilitiesCmd.AddCommand(vulnerabilitiesGetCmd)
	vulnerabilitiesGetCmd.Flags().StringVar(&vulnerabilitiesGetID, "id", "", "Vulnerability ID")
	_ = vulnerabilitiesGetCmd.MarkFlagRequired("id")

	vulnerabilitiesCmd.AddCommand(vulnerabilitiesDeactivateCmd)
	vulnerabilitiesDeactivateCmd.Flags().StringVar(&vulnerabilitiesDeactivateJSON, "json", "", "Raw JSON payload")
	vulnerabilitiesDeactivateCmd.Flags().StringVar(&vulnerabilitiesDeactivateFile, "file", "", "Path to JSON payload file")

	vulnerabilitiesCmd.AddCommand(vulnerabilitiesReactivateCmd)
	vulnerabilitiesReactivateCmd.Flags().StringVar(&vulnerabilitiesReactivateJSON, "json", "", "Raw JSON payload")
	vulnerabilitiesReactivateCmd.Flags().StringVar(&vulnerabilitiesReactivateFile, "file", "", "Path to JSON payload file")
}
