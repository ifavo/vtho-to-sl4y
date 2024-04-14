// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract SL4YMinter is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20Upgradeable public VTHO;
    ERC20PresetMinterPauserUpgradeable public SL4Y;
    address payable public vault;

    mapping(uint256 => uint256) public swapRates;

    event SL4YAddressChanged(
        address indexed oldAddress,
        address indexed newAddress
    );

    event VaultAddressChanged(
        address indexed oldAddress,
        address indexed newAddress
    );

    event SwapRateChanged(
        uint256 indexed VTHOAmount,
        uint256 indexed SL4YAmount
    );

    event SL4YMinted(
        address indexed minter,
        uint256 indexed VTHOAmount,
        uint256 indexed SL4YAmount
    );

    event TokenClaimed(
        address indexed tokenAddress,
        address indexed claimer,
        uint256 amount
    );

    event VetClaimed(address indexed claimer, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _VTHO,
        address _SL4Y,
        address payable _vault
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init(); // Initialize the ReentrancyGuard

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        VTHO = IERC20Upgradeable(_VTHO);
        SL4Y = ERC20PresetMinterPauserUpgradeable(_SL4Y);
        vault = _vault;

        // Initialize swap rates, use ether as helper for formatting the numbers
        swapRates[5000 ether] = 5 ether;
        swapRates[10000 ether] = 10 ether;
        swapRates[15000 ether] = 20 ether;
        swapRates[25000 ether] = 40 ether;
    }

    function setSwapRate(
        uint256 _VTHOAmount,
        uint256 _SL4YAmount
    ) public onlyRole(ADMIN_ROLE) {
        swapRates[_VTHOAmount] = _SL4YAmount;
        emit SwapRateChanged(_VTHOAmount, _SL4YAmount);
    }

    function setSL4YAddress(address _SL4Y) public onlyRole(ADMIN_ROLE) {
        emit SL4YAddressChanged(address(SL4Y), _SL4Y);
        SL4Y = ERC20PresetMinterPauserUpgradeable(_SL4Y);
    }

    function setVaultAddress(
        address payable _vault
    ) public onlyRole(ADMIN_ROLE) {
        emit VaultAddressChanged(vault, _vault);
        vault = _vault;
    }

    function swapVTHOforSL4Y(uint256 _VTHOAmount) public nonReentrant {
        require(swapRates[_VTHOAmount] > 0, "Swap rate not defined");
        uint256 SL4YAmount = swapRates[_VTHOAmount];

        VTHO.safeTransferFrom(msg.sender, vault, _VTHOAmount);
        SL4Y.mint(msg.sender, SL4YAmount);
        emit SL4YMinted(msg.sender, _VTHOAmount, SL4YAmount);
    }

    function claimToken(
        address _tokenAddress,
        uint256 _amount
    ) public onlyRole(ADMIN_ROLE) {
        IERC20Upgradeable(_tokenAddress).safeTransfer(msg.sender, _amount);
        emit TokenClaimed(_tokenAddress, msg.sender, _amount);
    }

    function claimVet(uint256 _amount) public onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(_amount);
        emit VetClaimed(msg.sender, _amount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _grantRole(
        bytes32 role,
        address account
    ) internal override(AccessControlUpgradeable) {
        super._grantRole(role, account);
    }

    function _revokeRole(
        bytes32 role,
        address account
    ) internal override(AccessControlUpgradeable) {
        super._revokeRole(role, account);
    }

    receive() external payable {}
}
