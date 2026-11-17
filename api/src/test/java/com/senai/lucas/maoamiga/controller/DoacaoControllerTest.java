package com.senai.lucas.maoamiga.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.senai.lucas.maoamiga.entity.Doacao;
import com.senai.lucas.maoamiga.repository.DoacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DoacaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DoacaoRepository doacaoRepository;

    @BeforeEach
    void limpar() {
        doacaoRepository.deleteAll();
    }

    @Test
    void deveExecutarCrudCompletoDeDoacoesPreservandoIdECriadoEmNaEdicao() throws Exception {
        String novaJson = """
                {
                  "tipoItem": "Roupas de inverno",
                  "quantidade": 5,
                  "pontoDestino": "Ponto de Coleta Setor Bueno"
                }
                """;

        MvcResult created = mockMvc.perform(post("/api/v1/doacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(novaJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.tipoItem").value("Roupas de inverno"))
                .andExpect(jsonPath("$.quantidade").value(5))
                .andExpect(jsonPath("$.pontoDestino").value("Ponto de Coleta Setor Bueno"))
                .andExpect(jsonPath("$.criadoEm").isNotEmpty())
                .andReturn();

        JsonNode createdNode = objectMapper.readTree(created.getResponse().getContentAsString());
        String id = createdNode.get("id").asText();
        String criadoEmOriginal = createdNode.get("criadoEm").asText();

        mockMvc.perform(get("/api/v1/doacoes/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.criadoEm").value(criadoEmOriginal));

        String editadaJson = """
                {
                  "tipoItem": "Cestas básicas",
                  "quantidade": 8,
                  "pontoDestino": "Ponto de Distribuição Setor Sul"
                }
                """;

        mockMvc.perform(put("/api/v1/doacoes/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(editadaJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.tipoItem").value("Cestas básicas"))
                .andExpect(jsonPath("$.quantidade").value(8))
                .andExpect(jsonPath("$.criadoEm").value(criadoEmOriginal));

        mockMvc.perform(delete("/api/v1/doacoes/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/doacoes/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveFiltrarPorTipoItemSemCaseSensitiveEOrdenarDaMaisNovaParaMaisAntiga() throws Exception {
        doacaoRepository.save(Doacao.builder()
                .tipoItem("Roupas infantis")
                .quantidade(3)
                .pontoDestino("Ponto de Coleta Setor Bueno")
                .criadoEm(LocalDateTime.of(2026, 11, 10, 9, 0, 0))
                .build());
        doacaoRepository.save(Doacao.builder()
                .tipoItem("Alimentos não perecíveis")
                .quantidade(10)
                .pontoDestino("Ponto de Distribuição Vila Nova")
                .criadoEm(LocalDateTime.of(2026, 11, 12, 14, 0, 0))
                .build());
        doacaoRepository.save(Doacao.builder()
                .tipoItem("ROUPAS de adulto")
                .quantidade(4)
                .pontoDestino("Ponto de Coleta Setor Marista")
                .criadoEm(LocalDateTime.of(2026, 11, 15, 16, 30, 0))
                .build());

        mockMvc.perform(get("/api/v1/doacoes/filtro").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.content[0].tipoItem").value("ROUPAS de adulto"))
                .andExpect(jsonPath("$.content[1].tipoItem").value("Alimentos não perecíveis"))
                .andExpect(jsonPath("$.content[2].tipoItem").value("Roupas infantis"))
                .andExpect(jsonPath("$.page.totalElements").value(3));

        mockMvc.perform(get("/api/v1/doacoes/filtro")
                        .param("filtro", "roupas")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].tipoItem").value("ROUPAS de adulto"))
                .andExpect(jsonPath("$.content[1].tipoItem").value("Roupas infantis"));
    }

    @Test
    void deveResponder400SemGravarParaQuantidadeZeroNegativaOuTipoVazio() throws Exception {
        String[] invalidos = {
                """
                {"tipoItem": "Roupas", "quantidade": 0, "pontoDestino": "Ponto de Coleta Setor Bueno"}
                """,
                """
                {"tipoItem": "Roupas", "quantidade": -3, "pontoDestino": "Ponto de Coleta Setor Bueno"}
                """,
                """
                {"tipoItem": "", "quantidade": 2, "pontoDestino": "Ponto de Coleta Setor Bueno"}
                """,
                """
                {"tipoItem": "Alimentos", "quantidade": 2, "pontoDestino": "   "}
                """
        };

        for (String payload : invalidos) {
            mockMvc.perform(post("/api/v1/doacoes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }

        assertThat(doacaoRepository.count()).isZero();
    }

    @Test
    void deveResponder404ParaIdInexistenteOuInvalido() throws Exception {
        UUID inexistente = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/doacoes/{id}", inexistente))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/doacoes/{id}", "nao-e-uuid"))
                .andExpect(status().isNotFound());

        String validoJson = """
                {
                  "tipoItem": "Livros",
                  "quantidade": 4,
                  "pontoDestino": "Ponto de Coleta Setor Bueno"
                }
                """;

        mockMvc.perform(put("/api/v1/doacoes/{id}", inexistente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validoJson))
                .andExpect(status().isNotFound());
    }
}
