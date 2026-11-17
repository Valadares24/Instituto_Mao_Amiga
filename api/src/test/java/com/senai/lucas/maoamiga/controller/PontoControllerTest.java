package com.senai.lucas.maoamiga.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.senai.lucas.maoamiga.config.DataInitializer;
import com.senai.lucas.maoamiga.repository.PontoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PontoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PontoRepository pontoRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @Test
    void deveCarregarPeloMenosVinteECincoPontosIniciaisSemDuplicar() throws Exception {
        long antes = pontoRepository.count();
        assertThat(antes).isGreaterThanOrEqualTo(25);

        dataInitializer.run();
        assertThat(pontoRepository.count()).isEqualTo(antes);

        mockMvc.perform(get("/api/v1/pontos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(25)));
    }

    @Test
    void deveFiltrarEPaginarPontosComPadraoDeDezOrdenadosPorNome() throws Exception {
        MvcResult semFiltro = mockMvc.perform(get("/api/v1/pontos/filtro"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.page.size").value(10))
                .andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$.page.totalElements").value(greaterThanOrEqualTo(25)))
                .andReturn();

        JsonNode page0 = objectMapper.readTree(semFiltro.getResponse().getContentAsString());
        List<String> nomes = new ArrayList<>();
        page0.get("content").forEach(n -> nomes.add(n.get("nome").asText()));
        assertThat(nomes).isSortedAccordingTo(String::compareTo);

        mockMvc.perform(get("/api/v1/pontos/filtro")
                        .param("filtro", "bueno")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.content[0].bairro").value("Setor Bueno"));

        mockMvc.perform(get("/api/v1/pontos/filtro")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.page.number").value(1));

        MvcResult ordenadoPorBairro = mockMvc.perform(get("/api/v1/pontos/filtro")
                        .param("sort", "bairro,asc")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode bairroNode = objectMapper.readTree(ordenadoPorBairro.getResponse().getContentAsString());
        List<String> bairros = new ArrayList<>();
        bairroNode.get("content").forEach(n -> bairros.add(n.get("bairro").asText()));
        assertThat(bairros).isSortedAccordingTo(String::compareTo);
    }

    @Test
    void deveExecutarCrudCompletoDePontos() throws Exception {
        String novoJson = """
                {
                  "nome": "Ponto de Coleta Teste Central",
                  "endereco": "Av. Goiás, nº 100, Goiânia-GO",
                  "bairro": "Centro",
                  "horario": "Seg a Sex, 8h às 17h",
                  "tipo": "coleta"
                }
                """;

        MvcResult created = mockMvc.perform(post("/api/v1/pontos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(novoJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.nome").value("Ponto de Coleta Teste Central"))
                .andReturn();

        JsonNode createdNode = objectMapper.readTree(created.getResponse().getContentAsString());
        String id = createdNode.get("id").asText();

        mockMvc.perform(get("/api/v1/pontos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bairro").value("Centro"));

        String editadoJson = """
                {
                  "nome": "Ponto de Distribuição Teste Central",
                  "endereco": "Av. Goiás, nº 200, Goiânia-GO",
                  "bairro": "Centro",
                  "horario": "Seg a Sáb, 9h às 16h",
                  "tipo": "distribuição"
                }
                """;

        mockMvc.perform(put("/api/v1/pontos/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(editadoJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Ponto de Distribuição Teste Central"))
                .andExpect(jsonPath("$.tipo").value("distribuição"));

        mockMvc.perform(delete("/api/v1/pontos/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/pontos/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveResponder400SemGravarQuandoCampoObrigatorioVazio() throws Exception {
        long antes = pontoRepository.count();

        String invalidoJson = """
                {
                  "nome": "",
                  "endereco": "Rua 1",
                  "bairro": "Centro",
                  "horario": "Seg a Sex, 8h às 17h",
                  "tipo": "coleta"
                }
                """;

        mockMvc.perform(post("/api/v1/pontos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidoJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertThat(pontoRepository.count()).isEqualTo(antes);

        UUID existenteId = pontoRepository.findAll().get(0).getId();
        mockMvc.perform(put("/api/v1/pontos/{id}", existenteId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidoJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveResponder404ParaIdInexistenteOuInvalido() throws Exception {
        UUID inexistente = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/pontos/{id}", inexistente))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/pontos/{id}", "id-invalido"))
                .andExpect(status().isNotFound());

        String validoJson = """
                {
                  "nome": "Ponto Fantasma",
                  "endereco": "Rua 1",
                  "bairro": "Centro",
                  "horario": "Seg a Sex, 8h às 17h",
                  "tipo": "coleta"
                }
                """;

        mockMvc.perform(put("/api/v1/pontos/{id}", inexistente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validoJson))
                .andExpect(status().isNotFound());
    }
}
