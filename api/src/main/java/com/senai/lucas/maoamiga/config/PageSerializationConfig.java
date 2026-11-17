package com.senai.lucas.maoamiga.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class PageSerializationConfig {

    @Bean
    public Module pageViaDtoSerializationModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(Page.class, new JsonSerializer<Page>() {
            @Override
            public void serialize(Page value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                gen.writeStartObject();
                gen.writeObjectField("content", value.getContent());
                Map<String, Object> pageMetadata = new LinkedHashMap<>();
                pageMetadata.put("size", value.getSize());
                pageMetadata.put("number", value.getNumber());
                pageMetadata.put("totalElements", value.getTotalElements());
                pageMetadata.put("totalPages", value.getTotalPages());
                gen.writeObjectField("page", pageMetadata);
                gen.writeEndObject();
            }
        });
        return module;
    }
}
