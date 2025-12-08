// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Simplified ERC-8004 Agent Registry
/// @notice Maps PeerHost Projects to their MCP Discovery Manifests
contract AgentRegistry {
    // Mapping from Project ID (string) to MCP Manifest URL (string)
    mapping(string => string) public manifestUrls;

    // Mapping from Project ID to Owner Address
    mapping(string => address) public projectOwners;

    event AgentRegistered(
        string indexed projectId,
        string manifestUrl,
        address owner
    );

    /// @notice Registers or updates an Agent Identity
    /// @param projectId The unique identifier of the project (e.g. "my-project")
    /// @param mcpUrl The URL where the MCP JSON is hosted (e.g. "https://api.peerhost.net/my-project/mcp.json")
    function register(
        string calldata projectId,
        string calldata mcpUrl
    ) external {
        // Simple ownership check: if already registered, only owner can update
        if (projectOwners[projectId] != address(0)) {
            require(
                projectOwners[projectId] == msg.sender,
                "Not project owner"
            );
        } else {
            projectOwners[projectId] = msg.sender;
        }

        manifestUrls[projectId] = mcpUrl;

        emit AgentRegistered(projectId, mcpUrl, msg.sender);
    }

    /// @notice Discovery Function for Agents
    function discover(
        string calldata projectId
    ) external view returns (string memory) {
        return manifestUrls[projectId];
    }
}
