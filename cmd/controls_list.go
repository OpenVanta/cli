package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// controlsListCmd represents the controls list command
var controlsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List controls",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("controls list called")
	},
}

func init() {
	controlsCmd.AddCommand(controlsListCmd)
}
