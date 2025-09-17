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
 * @title CertificateNFT
 * @dev A simple ERC721 based contract for issuing and managing verifiable certificates.
 * Each certificate is represented as a unique Non-Fungible Token (NFT).
 */
contract CertificateNFT {

    // State Variables
    string public name = "CertChain Certificate";
    string public symbol = "CERT";
    address public owner; // The address that deployed the contract

    struct Certificate {
        string recipientName;
        string certificateTitle;
        uint256 issueDate;
        string certificateHash; // IPFS hash or other unique identifier for the certificate data
        address issuer;
    }

    // Mapping from token ID to Certificate details
    mapping(uint256 => Certificate) private _certificates;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping from owner to token count
    mapping(address => uint256) private _balances;

    // A counter for new certificate IDs
    uint256 private _nextTokenId;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event CertificateIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string certificateHash);

    // Modifier to ensure only the contract owner can call a function
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Sets the contract deployer as the owner.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Issues a new certificate (mints a new NFT).
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
    ) public onlyOwner {
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

    /**
     * @dev Returns the details of a specific certificate.
     * @param tokenId The ID of the token.
     * @return The certificate details struct.
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
            <CardTitle>Basic Certificate NFT</CardTitle>
            <CardDescription>
              A simple ERC721-like contract for issuing certificates as NFTs.
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
