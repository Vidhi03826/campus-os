package com.vidhi.campusos.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface StorageService {

    String store(MultipartFile file) throws IOException;

    byte[] load(String storageKey) throws IOException;

    void delete(String storageKey) throws IOException;
}