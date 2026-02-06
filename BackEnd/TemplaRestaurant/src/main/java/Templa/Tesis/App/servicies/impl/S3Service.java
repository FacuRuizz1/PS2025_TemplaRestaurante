package Templa.Tesis.App.servicies.impl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class S3Service {

    private final S3Client s3;
    private final String bucketName = "templarestaurante";

    public S3Service() {
        try {
            AwsCredentialsProvider provider = ProfileCredentialsProvider.create("default");

            AwsCredentials creds = provider.resolveCredentials();

            this.s3 = S3Client.builder()
                    .region(Region.US_EAST_1)
                    .credentialsProvider(provider)
                    .build();


        } catch (Exception e) {
            throw new RuntimeException("Error al inicializar S3Client: " + e.getMessage(), e);
        }
    }

    public String uploadFile(MultipartFile file) {

        String key = "platos/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        try (InputStream inputStream = file.getInputStream()) {
            String contentType = URLConnection.guessContentTypeFromName(file.getOriginalFilename());
            if (contentType == null) contentType = "application/octet-stream";

            PutObjectRequest putReq = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3.putObject(putReq, RequestBody.fromInputStream(inputStream, file.getSize()));

            String publicUrl = "https://" + bucketName + ".s3.us-east-1.amazonaws.com/" + key;
            return publicUrl;

        } catch (S3Exception e) {
            log.error("❌ Error de S3 (código={}): {}", e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage(), e);
            throw new RuntimeException("Error S3 al subir archivo: " + e.getMessage(), e);
        } catch (IOException e) {
            log.error("❌ Error de IO al leer el archivo: {}", e.getMessage(), e);
            throw new RuntimeException("Error al leer archivo: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Error inesperado durante la subida: {}", e.getMessage(), e);
            throw new RuntimeException("Error inesperado: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            // 📌 Extraer la clave del archivo desde la URL pública
            // Ejemplo: https://templarestaurante.s3.us-east-1.amazonaws.com/platos/uuid_foto.jpg
            String key = fileUrl.substring(fileUrl.indexOf(".com/") + 5);
            log.info("🗑️ Eliminando archivo de S3 con key={}", key);

            s3.deleteObject(b -> b.bucket(bucketName).key(key));
            log.info("✅ Archivo eliminado correctamente de S3");
        } catch (S3Exception e) {
            log.error("❌ Error de S3 al eliminar archivo: {}", e.awsErrorDetails().errorMessage());
            throw new RuntimeException("Error al eliminar archivo: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Error inesperado al eliminar archivo: {}", e.getMessage(), e);
        }
    }
}
