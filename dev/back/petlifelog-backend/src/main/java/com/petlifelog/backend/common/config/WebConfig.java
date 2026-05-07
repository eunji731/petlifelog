package com.petlifelog.backend.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.base-path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 실제 운영체제의 절대 경로를 가져와서 리소스 핸들러에 등록합니다.
        Path path = Paths.get(uploadPath).toAbsolutePath().normalize();
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + path.toString() + "/");

        // AttachedFile 시스템: /files/{parentType}/{parentId}/{uuid}.ext → D:/uploads/files/
        Path filesPath = path.resolve("files");
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + filesPath.toString() + "/");
    }
}
