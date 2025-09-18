
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificatePlatform
 * @dev A contract for issuing and managing verifiable certificates with role-based access control.
 * The contract owner can add/remove issuers. Authorized issuers can issue/revoke certificates.
 */
contract CertificatePlatform is Ownable {
    // --- State Variables ---

    struct Certificate {
        address issuer;
        string holderId;      // An identifier for the certificate holder (e.g., student ID, employee ID)
        string metadataURI;   // URI for certificate details (e.g., IPFS)
        uint256 issuedAt;
        bool revoked;
    }

    // Mapping to track authorized issuer addresses
    mapping(address => bool) public issuers;

    // Mapping from a holder's ID to their array of certificates
    mapping(string => Certificate[]) private certificatesByHolder;

    // --- Events ---

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CertificateIssued(address indexed issuer, string holderId, string metadataURI);
    event CertificateRevoked(address indexed issuer, string holderId, string metadataURI);

    /**
     * @dev Sets the contract deployer as the initial owner.
     */
    constructor() Ownable(msg.sender) {}

    // --- Owner Functions ---

    /**
     * @dev Allows the owner to authorize a new issuer.
     * @param _issuer The address of the new issuer.
     */
    function addIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Cannot add the zero address");
        issuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    /**
     * @dev Allows the owner to remove an issuer.
     * @param _issuer The address of the issuer to remove.
     */
    function removeIssuer(address _issuer) external onlyOwner {
        issuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    // --- Issuer Functions ---

    /**
     * @dev Allows an authorized issuer to issue a new certificate.
     * @param holderId The unique identifier for the certificate recipient.
     * @param metadataURI The URI pointing to the certificate's metadata.
     */
    function issueCertificate(string calldata holderId, string calldata metadataURI) external {
        require(issuers[msg.sender], "Not an authorized issuer");

        Certificate memory cert = Certificate({
            issuer: msg.sender,
            holderId: holderId,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            revoked: false
        });

        certificatesByHolder[holderId].push(cert);
        emit CertificateIssued(msg.sender, holderId, metadataURI);
    }

    /**
     * @dev Allows an issuer to revoke a certificate they previously issued.
     * @param holderId The identifier of the holder whose certificate is being revoked.
     * @param index The index of the certificate in the holder's array.
     */
    function revokeCertificate(string calldata holderId, uint256 index) external {
        require(issuers[msg.sender], "Not an authorized issuer");
        require(index < certificatesByHolder[holderId].length, "Invalid certificate index");
        
        Certificate storage cert = certificatesByHolder[holderId][index];
        require(cert.issuer == msg.sender, "Only the original issuer can revoke this certificate");
        require(!cert.revoked, "Certificate has already been revoked");

        cert.revoked = true;
        emit CertificateRevoked(msg.sender, holderId, cert.metadataURI);
    }

    // --- View Functions ---

    /**
     * @dev Retrieves all certificates for a given holder ID.
     * @param holderId The identifier of the holder.
     * @return An array of Certificate structs.
     */
    function getCertificates(string calldata holderId) external view returns (Certificate[] memory) {
        return certificatesByHolder[holderId];
    }

    /**
     * @dev Verifies a single certificate by its holder ID and index.
     * @param holderId The identifier of the holder.
     * @param index The index of the certificate in the holder's array.
     * @return The Certificate struct.
     */
    function verifyCertificate(
        string calldata holderId,
        uint256 index
    ) external view returns (Certificate memory) {
        require(index < certificatesByHolder[holderId].length, "Invalid index");
        return certificatesByHolder[holderId][index];
    }

    /**
     * @dev Checks if a given address is an authorized issuer.
     * @param account The address to check.
     * @return true if the address is an issuer, false otherwise.
     */
    function isIssuer(address account) external view returns (bool) {
        return issuers[account];
    }
}
`