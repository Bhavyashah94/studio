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

/**
 * @title VeriCredCertificate
 * @dev An ERC721-like contract for issuing and managing verifiable certificates.
 * Implements Ownable for access control, allowing an owner to manage issuers.
 */
contract VeriCredCertificate {
    // --- State Variables ---

    string public name = "VeriCred Certificate";
    string public symbol = "VCRED";
    address public owner;

    struct Certificate {
        string recipientName;
        string certificateTitle;
        uint256 issueDate;
        string certificateHash; // IPFS hash or other unique identifier
        address issuer;
    }

    // --- Mappings ---

    mapping(uint256 => Certificate) private _certificates;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(address => bool) public isIssuer; // Mapping to track approved issuers

    uint256 private _nextTokenId;

    // --- Events ---

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event CertificateIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string certificateHash);
    event IssuerAdded(address indexed account);
    event IssuerRemoved(address indexed account);

    // --- Modifiers ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Caller is not an authorized issuer");
        _;
    }

    // --- Constructor ---

    constructor() {
        owner = msg.sender;
        // The contract deployer is automatically an issuer
        isIssuer[msg.sender] = true;
        emit IssuerAdded(msg.sender);
    }

    // --- Issuer Management Functions (Owner-only) ---

    /**
     * @dev Adds a new address to the list of authorized issuers.
     * @param account The address to add.
     */
    function addIssuer(address account) public onlyOwner {
        require(account != address(0), "Cannot add the zero address");
        require(!isIssuer[account], "Account is already an issuer");
        isIssuer[account] = true;
        emit IssuerAdded(account);
    }

    /**
     * @dev Removes an address from the list of authorized issuers.
     * @param account The address to remove.
     */
    function removeIssuer(address account) public onlyOwner {
        require(isIssuer[account], "Account is not an issuer");
        isIssuer[account] = false;
        emit IssuerRemoved(account);
    }


    // --- Certificate Functions ---

    /**
     * @dev Issues a new certificate. Can only be called by an authorized issuer.
     * @param recipient The address of the person receiving the certificate.
     * @param recipientName The name of the recipient.
     * @param certificateTitle The title of the certificate.
     * @param certificateHash A unique hash (e.g., IPFS CID) of the certificate details.
     */
    function issueCertificate(
        address recipient,
        string memory recipientName,
        string memory certificateTitle,
        string memory certificateHash
    ) public onlyIssuer {
        require(recipient != address(0), "ERC721: mint to the zero address");

        uint256 tokenId = _nextTokenId++;
        _balances[recipient]++;
        _owners[tokenId] = recipient;

        _certificates[tokenId] = Certificate({
            recipientName: recipientName,
            certificateTitle: certificateTitle,
            issueDate: block.timestamp,
            certificateHash: certificateHash,
            issuer: msg.sender
        });

        emit Transfer(address(0), recipient, tokenId);
        emit CertificateIssued(tokenId, recipient, msg.sender, certificateHash);
    }

    // --- View Functions ---

    /**
     * @dev Returns the details of a specific certificate.
     */
    function getCertificate(uint256 tokenId) public view returns (Certificate memory) {
        require(_exists(tokenId), "ERC721: query for nonexistent token");
        return _certificates[tokenId];
    }

    /**
     * @dev Returns the owner of the specified token ID.
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "ERC721: owner query for nonexistent token");
        return tokenOwner;
    }

    /**
     * @dev Returns the number of tokens in an owner's account.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Internal function to check if a token exists.
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }
}
`;

export default function TemplatesPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(contractCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold font-headline">Smart Contract Templates</h1>
        <p className="text-muted-foreground mt-1">
          Use these templates as a starting point for your on-chain logic.
        </p>
       </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Role-Based Certificate NFT</CardTitle>
            <CardDescription>
              A robust contract with Owner and Issuer roles for access control.
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-sm font-code">
              <code>{contractCode.trim()}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
