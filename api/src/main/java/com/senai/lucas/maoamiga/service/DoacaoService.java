package com.senai.lucas.maoamiga.service;

import com.senai.lucas.maoamiga.dto.DoacaoRequestDTO;
import com.senai.lucas.maoamiga.dto.DoacaoResponseDTO;
import com.senai.lucas.maoamiga.entity.Doacao;
import com.senai.lucas.maoamiga.repository.DoacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoacaoService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 50;

    private final DoacaoRepository doacaoRepository;

    @Transactional(readOnly = true)
    public Page<DoacaoResponseDTO> findByFiltro(String filtro, Pageable pageable) {
        Pageable pageableSeguro = limitarPageable(pageable);

        Page<Doacao> paginaDoacoes;
        if (filtro == null || filtro.isBlank()) {
            paginaDoacoes = doacaoRepository.findAll(pageableSeguro);
        } else {
            paginaDoacoes = doacaoRepository.findByTipoItemContainingIgnoreCase(filtro.trim(), pageableSeguro);
        }

        return paginaDoacoes.map(DoacaoResponseDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public DoacaoResponseDTO findById(UUID id) {
        Doacao doacao = buscarEntidadePorIdOu404(id);
        return DoacaoResponseDTO.fromEntity(doacao);
    }

    @Transactional
    public DoacaoResponseDTO save(DoacaoRequestDTO dto) {
        Doacao nova = dto.toEntity();
        nova.setCriadoEm(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        Doacao salva = doacaoRepository.save(nova);
        return DoacaoResponseDTO.fromEntity(salva);
    }

    @Transactional
    public DoacaoResponseDTO update(UUID doacaoId, DoacaoRequestDTO dto) {
        Doacao existente = buscarEntidadePorIdOu404(doacaoId);
        existente.setTipoItem(dto.tipoItem().trim());
        existente.setQuantidade(dto.quantidade());
        existente.setPontoDestino(dto.pontoDestino().trim());
        Doacao atualizada = doacaoRepository.save(existente);
        return DoacaoResponseDTO.fromEntity(atualizada);
    }

    @Transactional
    public void delete(UUID doacaoId) {
        Doacao existente = buscarEntidadePorIdOu404(doacaoId);
        doacaoRepository.delete(existente);
    }

    private Pageable limitarPageable(Pageable pageable) {
        if (pageable == null || pageable.isUnpaged()) {
            return PageRequest.of(DEFAULT_PAGE, DEFAULT_SIZE);
        }
        int paginaSegura = Math.max(DEFAULT_PAGE, pageable.getPageNumber());
        int tamanhoSolicitado = pageable.getPageSize() <= 0 ? DEFAULT_SIZE : pageable.getPageSize();
        int tamanhoSeguro = Math.min(tamanhoSolicitado, MAX_SIZE);

        return PageRequest.of(paginaSegura, tamanhoSeguro, pageable.getSort());
    }

    private Doacao buscarEntidadePorIdOu404(UUID id) {
        return doacaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Doação não encontrada para o ID: " + id
                ));
    }
}
