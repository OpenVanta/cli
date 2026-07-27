package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

// Version is the CLI version. Release builds set this via GoReleaser ldflags.
var Version = "dev"

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the Vanta CLI version",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Fprintf(cmd.OutOrStdout(), "vanta %s\n", displayVersion(Version))
	},
}

func init() {
	rootCmd.Version = displayVersion(Version)
	rootCmd.SetVersionTemplate("vanta {{.Version}}\n")
	rootCmd.AddCommand(versionCmd)
}

func displayVersion(version string) string {
	version = strings.TrimSpace(version)
	if version == "" {
		return "dev"
	}
	if version == "dev" || strings.HasPrefix(version, "v") {
		return version
	}
	return "v" + version
}

func normalizeVersion(version string) string {
	version = strings.TrimSpace(version)
	version = strings.TrimPrefix(version, "v")
	version = strings.TrimPrefix(version, "V")
	if idx := strings.IndexAny(version, "-+"); idx >= 0 {
		version = version[:idx]
	}
	return version
}
