package com.sentinel.security.service;

import com.sentinel.security.model.Asset;
import com.sentinel.security.repo.AssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AssetService {

    private AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository){
        this.assetRepository=assetRepository;
    }

    @Transactional
    public Asset createAsset(Asset asset) {
        if (asset.getAssetId() == null) {
            asset.setAssetId(UUID.randomUUID());
        }
        if (asset.getStatus() == null) {
            asset.setStatus(Asset.HealthStatus.HEALTHY);
        }
        if (asset.getCreatedAt() == null) {
            asset.setCreatedAt(OffsetDateTime.now());
        }
        if (asset.getLastSeen() == null) {
            asset.setLastSeen(OffsetDateTime.now());
        }
        return assetRepository.save(asset);
    }

    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    public List<Asset> getAllByIpPrefix(String prefix){
        return assetRepository.findByIpPrefix(prefix);
    }

    public Optional<Asset> getAssetById(UUID id) {
        return assetRepository.findById(id);
    }

    public Asset updateAsset(UUID id, Asset assetDetails) {
        Asset existingAsset = getAssetById(id).orElse(null);

        if (existingAsset == null) {
            return null;
        }

        existingAsset.setIp(assetDetails.getIp());
        existingAsset.setName(assetDetails.getName());
        existingAsset.setType(assetDetails.getType());
        existingAsset.setStatus(assetDetails.getStatus());
        existingAsset.setUpdatedAt(OffsetDateTime.now());

        return assetRepository.save(existingAsset);
    }

    @Transactional
    public void deleteAsset(UUID id) {
        assetRepository.deleteById(id);
    }
}
