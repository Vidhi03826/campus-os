package com.vidhi.campusos.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private static final String PDF_EXTENSION = ".pdf";

    private final Path storageDirectory;

    public LocalStorageService(
            @Value("${app.storage.resume-dir}")
            String resumeDirectory
    ) {

        this.storageDirectory =
                Paths.get(resumeDirectory)
                        .toAbsolutePath()
                        .normalize();
    }

    @Override
    public String store(
            MultipartFile file
    ) throws IOException {

        Files.createDirectories(
                storageDirectory
        );

        /*
         * Never use the user's original filename
         * as the physical storage filename.
         */
        String storageKey =
                UUID.randomUUID() + PDF_EXTENSION;

        Path target =
                resolveStoragePath(storageKey);

        /*
         * CREATE_NEW guarantees that an existing file
         * will never be silently overwritten.
         */
        try (
                InputStream inputStream =
                        file.getInputStream();

                OutputStream outputStream =
                        Files.newOutputStream(
                                target,
                                StandardOpenOption.CREATE_NEW,
                                StandardOpenOption.WRITE
                        )
        ) {

            inputStream.transferTo(outputStream);

        } catch (IOException exception) {

            /*
             * If writing failed halfway through,
             * remove the partial file.
             */
            Files.deleteIfExists(target);

            throw exception;
        }

        return storageKey;
    }

    @Override
    public byte[] load(
            String storageKey
    ) throws IOException {

        Path target =
                resolveStoragePath(storageKey);

        return Files.readAllBytes(target);
    }

    @Override
    public void delete(
            String storageKey
    ) throws IOException {

        Path target =
                resolveStoragePath(storageKey);

        Files.deleteIfExists(target);
    }

    private Path resolveStoragePath(
            String storageKey
    ) throws IOException {

        validateStorageKey(storageKey);

        Files.createDirectories(
                storageDirectory
        );

        /*
         * Resolve the real storage directory first.
         * This gives us a stronger filesystem boundary
         * when the configured directory contains symlinks.
         */
        Path realStorageDirectory =
                storageDirectory.toRealPath();

        Path target =
                realStorageDirectory
                        .resolve(storageKey)
                        .normalize();

        /*
         * The target must remain directly inside the
         * storage directory.
         */
        if (!target.getParent()
                .equals(realStorageDirectory)) {

            throw new IOException(
                    "Invalid storage path"
            );
        }

        /*
         * A stored file should never be a symbolic link.
         */
        if (Files.exists(
                target,
                LinkOption.NOFOLLOW_LINKS
        ) && Files.isSymbolicLink(target)) {

            throw new IOException(
                    "Symbolic links are not allowed"
            );
        }

        return target;
    }

    private void validateStorageKey(
            String storageKey
    ) {

        if (storageKey == null ||
                storageKey.length() != 40 ||
                !storageKey.endsWith(PDF_EXTENSION)) {

            throw new IllegalArgumentException(
                    "Invalid storage key"
            );
        }

        String uuidPart =
                storageKey.substring(0, 36);

        try {

            UUID uuid =
                    UUID.fromString(uuidPart);

            if (!uuid.toString()
                    .equalsIgnoreCase(uuidPart)) {

                throw new IllegalArgumentException(
                        "Invalid storage key"
                );
            }

        } catch (IllegalArgumentException exception) {

            throw new IllegalArgumentException(
                    "Invalid storage key",
                    exception
            );
        }
    }
}