package com.vidhi.campusos.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private final Path storageDirectory;

    public LocalStorageService(
            @Value("${app.storage.resume-dir}") String resumeDirectory
    ) {
        this.storageDirectory =
                Paths.get(resumeDirectory)
                        .toAbsolutePath()
                        .normalize();
    }

    @Override
    public String store(MultipartFile file) throws IOException {

        Files.createDirectories(storageDirectory);

        String extension = getExtension(
                file.getOriginalFilename()
        );

        String storageKey =
                UUID.randomUUID() + extension;

        Path target =
                storageDirectory.resolve(storageKey)
                        .normalize();

        if (!target.getParent()
                .equals(storageDirectory)) {
            throw new IOException(
                    "Invalid storage path"
            );
        }

        Files.write(
                target,
                file.getBytes(),
                StandardOpenOption.CREATE_NEW
        );

        return storageKey;
    }

    @Override
    public byte[] load(String storageKey)
            throws IOException {

        Path target =
                storageDirectory.resolve(storageKey)
                        .normalize();

        if (!target.getParent()
                .equals(storageDirectory)) {
            throw new IOException(
                    "Invalid storage path"
            );
        }

        return Files.readAllBytes(target);
    }

    @Override
    public void delete(String storageKey)
            throws IOException {

        Path target =
                storageDirectory.resolve(storageKey)
                        .normalize();

        if (!target.getParent()
                .equals(storageDirectory)) {
            throw new IOException(
                    "Invalid storage path"
            );
        }

        Files.deleteIfExists(target);
    }

    private String getExtension(String fileName) {

        if (fileName == null) {
            return "";
        }

        String cleanName =
                Paths.get(fileName)
                        .getFileName()
                        .toString();

        int lastDot = cleanName.lastIndexOf('.');

        if (lastDot == -1) {
            return "";
        }

        return cleanName.substring(lastDot)
                .toLowerCase();
    }
}