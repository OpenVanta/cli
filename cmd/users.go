package cmd

import "github.com/spf13/cobra"

var usersCmd = &cobra.Command{
	Use:   "users",
	Short: "Manage users",
	Long:  "List active users and fetch user details from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(usersCmd)
}
